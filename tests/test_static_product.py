import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class StaticProductConversionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.index = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.app = (ROOT / "app.js").read_text(encoding="utf-8")

    def test_page_metadata_supports_social_sharing_and_indexing(self):
        expected = [
            '<link rel="canonical" href="https://quarkassistant.github.io/resume-reality-check/" />',
            '<meta property="og:title" content="AI Resume Reality Check" />',
            '<meta property="og:url" content="https://quarkassistant.github.io/resume-reality-check/" />',
            '<meta property="og:type" content="website" />',
            '<meta name="twitter:card" content="summary_large_image" />',
            'application/ld+json',
        ]
        for snippet in expected:
            with self.subTest(snippet=snippet):
                self.assertIn(snippet, self.index)

    def test_tip_cta_matches_public_kofi_minimum_and_is_visible_before_scroll(self):
        self.assertNotIn("$3-$10", self.index)
        self.assertIn("$5 Ko-fi tip", self.index)
        self.assertRegex(
            self.index,
            r'<a class="tip hero-tip" href="https://ko-fi\.com/quarkassistant"[^>]*>Tip via Ko-fi</a>',
        )
        self.assertIn('Runs locally in your browser; no upload.', self.index)

    def test_result_output_includes_post_value_tip_cta(self):
        self.assertIn('class="result-tip"', self.app)
        self.assertIn('https://ko-fi.com/quarkassistant', self.app)
        self.assertIn('https://www.paypal.me/quarkassistant', self.app)

    def test_product_has_low_friction_share_control(self):
        self.assertIn('id="share"', self.index)
        self.assertIn('Share this tool', self.index)
        self.assertIn('navigator.share', self.app)
        self.assertIn('navigator.clipboard.writeText', self.app)
        self.assertIn('https://quarkassistant.github.io/resume-reality-check/', self.app)

    def test_optional_job_post_keyword_gap_is_local_and_visible(self):
        self.assertIn('id="job-post"', self.index)
        self.assertIn('Job post text', self.index)
        self.assertIn('local ATS-style keyword gap', self.index)
        self.assertIn('function keywordGap(resumeText, jobText)', self.app)
        self.assertIn('Keyword gap from the job post', self.app)
        self.assertIn('sampleJob', self.app)
        self.assertIn("document.getElementById('job-post').value = ''", self.app)

    def test_robots_and_sitemap_exist_for_the_live_product_url(self):
        robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
        sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
        self.assertIn("Sitemap: https://quarkassistant.github.io/resume-reality-check/sitemap.xml", robots)
        self.assertIn("https://quarkassistant.github.io/resume-reality-check/", sitemap)
        self.assertIn("<changefreq>daily</changefreq>", sitemap)


if __name__ == "__main__":
    unittest.main()
