import unittest
from datetime import datetime,timezone
from scripts.refresh_stac_catalog import make_catalog, search_collection, valid_ring, convert_item

RING=[[110.4,-7.0],[110.45,-7.0],[110.45,-6.9],[110.4,-6.9],[110.4,-7.0]]
def feature(collection,ident):
 return {'type':'Feature','collection':collection,'id':ident,'properties':{'datetime':'2026-11-11T02:00:00Z','eo:cloud_cover':1.5},'geometry':{'type':'Polygon','coordinates':[RING]}}
class TestCatalog(unittest.TestCase):
 def test_2_collections_and_provenance(self):
  def transport(url,method,body):return {'features':[feature(body['collections'][0],'SENSOR-'+body['collections'][0])],'links':[]}
  got=make_catalog(datetime(2026,11,17,tzinfo=timezone.utc),30,transport)
  self.assertEqual(got['count'],2)
  self.assertEqual(got['counts']['sentinel-1-grd'],1)
  self.assertEqual(got['counts']['sentinel-2-l2a'],1)
  self.assertIn('NOT_SATELLITE_PIXELS_NOT_INSAR',got['sourceMode'])
 def test_reject_untrusted_pagination(self):
  def transport(url,method,body):return {'features':[feature(body['collections'][0],'SCENE_A')], 'links':[{'rel':'next','href':'https://evil.example/secret'}]}
  with self.assertRaisesRegex(RuntimeError,'Invalid STAC next'):search_collection('sentinel-1-grd','2026-10-01','2026-11-17',transport)
 def test_empty_or_partial_fails_closed(self):
  def transport(url,method,body):return {'features':[],'links':[]}
  with self.assertRaisesRegex(RuntimeError,'No STAC scenes'):make_catalog(datetime(2026,11,17,tzinfo=timezone.utc),30,transport)
 def test_duplicate_conflict_rejected(self):
  x=feature('sentinel-1-grd','SCENE_A')
  def transport(url,method,body):
   if method=='POST' and 'datetime' in body:return {'features':[x], 'links':[{'rel':'next','href':'https://stac.dataspace.copernicus.eu/v1/search?next=abc','method':'GET'}]}
   y=feature('sentinel-1-grd','SCENE_A');y['properties']['datetime']='2026-11-12T02:00:00Z'
   return {'features':[y],'links':[]}
  with self.assertRaisesRegex(RuntimeError,'Contradicting duplicate'):search_collection('sentinel-1-grd','2026-10-01','2026-11-17',transport)
 def test_reject_invalid_geometry(self):
  x=feature('sentinel-2-l2a','SCENE_S2');x['geometry']={'type':'MultiPolygon','coordinates':[[RING]]}
  with self.assertRaisesRegex(ValueError,'Only polygon'):convert_item(x,2)
 def test_no_network_outside_allowlist(self):
  from scripts.refresh_stac_catalog import call_stac
  with self.assertRaisesRegex(RuntimeError,'Untrusted STAC'):call_stac('https://example.org/invalid','GET',None)
if __name__=='__main__': unittest.main()