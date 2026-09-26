"""Negative/privacy audit regressions. All nonpublic identities are synthetic."""
import copy
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
from tools.verification import core, providers, cli

AT = '2026-09-26T12:00:00Z'

def pages_claim():
    return {'id':'fixture.pages', 'class':'evidence_backed','public':True,
            'evidence':{'type':'github_pages','expect':'published',
                        'repositories':['example/public-fixture','example/private-fixture']}}

class AuditPrivacyTests(unittest.TestCase):
    def test_negative_pages_result_fails(self):
        self.assertEqual(core.classify(pages_claim(), {'value':'not_published','at':AT}, None, None)[0], 'failed')

    def test_missing_predicate_is_never_verified(self):
        c=pages_claim();del c['evidence']['expect']
        self.assertEqual(core.classify(c, {'value':'published','at':AT}, None, None)[0], 'unverified')

    def test_missing_timestamp_is_never_verified(self):
        self.assertEqual(core.classify(pages_claim(), {'value':'published'}, None, None)[0], 'unverified')

    def test_mixed_visibility_is_rejected_by_both_providers(self):
        for provider in [providers.RegistryProvider(Path('.'), token='fixture'),providers.PortfolioProvider(Path('.'))]:
            with patch.object(provider,'_api_get',side_effect=[{'private':False,'has_pages':True,'pushed_at':AT}, {'private':True,'has_pages':True,'pushed_at':AT}]):
                ev=provider.resolve('github_pages',pages_claim()['evidence'])
            self.assertFalse(ev['public'])
            record={'public':True,'status':'verified','evidence':ev}
            self.assertFalse(core.is_public_safe(record))
            self.assertNotIn('private-fixture',json.dumps(core.build_projection({'claims':[record]})))

    def test_unknown_visibility_is_not_public(self):
        p=providers.RegistryProvider(Path('.'),token='fixture')
        with patch.object(p,'_api_get',return_value={'has_pages':True,'pushed_at':AT}):
            ev=p.resolve('github_pages',{'repositories':['example/unknown-fixture']})
        self.assertFalse(ev['public'])

    def test_nested_private_cannot_be_overridden_by_top_level(self):
        e={'public':True,'repositories':[{'repository':'example/private-fixture','public':False}]}
        self.assertFalse(core.is_public_safe({'public':True,'status':'verified','evidence':e}))

    def test_missing_nested_visibility_fails_closed(self):
        e={'public':True,'repositories':[{'repository':'example/unknown-fixture'}]}
        self.assertFalse(core.is_public_safe({'public':True,'status':'verified','evidence':e}))

    def test_branch_correct_yaml_url(self):
        self.assertIn('/blob/master/',providers._repo_yaml_url('example/fixture','master'))

    def test_public_pages_evidence_has_public_api_url(self):
        p=providers.RegistryProvider(Path('.'),token='fixture')
        with patch.object(p,'_api_get',return_value={'private':False,'has_pages':True,'pushed_at':AT}):
            ev=p.resolve('github_pages',{'repositories':['example/public-fixture']})
        self.assertEqual(ev['url'],'https://api.github.com/repos/example/public-fixture')
        self.assertTrue(ev['repositories'][0]['public'])

    def test_carried_forward_visibility_does_not_authorize_republication(self):
        record={'public':True,'carried_forward':True,'status':'verified',
                'evidence':{'public':True,'repository':'example/formerly-public'}}
        self.assertFalse(core.is_public_safe(record))
