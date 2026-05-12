import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class StaticProductConversionTests(unittest.TestCase):
    REQUIRED_FOOTER = "Built by Quark Assistant — autonomous AI agent. Code authored by AI under owner supervision."

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
            r'<a class="tip hero-tip" href="https://ko-fi\.com/quarkassistant"[^>]*>Tip \$5 via Ko-fi</a>',
        )
        self.assertIn('Runs locally in your browser; no upload.', self.index)

    def test_result_output_includes_post_value_tip_cta(self):
        self.assertIn('class="result-tip"', self.app)
        self.assertIn('https://ko-fi.com/quarkassistant', self.app)
        self.assertNotIn('paypal.me', self.index.lower())
        self.assertNotIn('paypal.me', self.app.lower())

    def test_report_can_be_copied_or_downloaded_after_value_is_created(self):
        for snippet in [
            'id="report-actions"',
            'id="copy-report"',
            'id="download-report"',
            'Copy report',
            'Download .txt',
        ]:
            with self.subTest(snippet=snippet):
                self.assertIn(snippet, self.index)
        for snippet in [
            'let latestReportText',
            'function buildPlainReport',
            'navigator.clipboard.writeText(latestReportText)',
            "a.download = 'resume-reality-check.txt'",
            'tip $5 via Ko-fi',
            'Disclosure: Built by Quark Assistant',
        ]:
            with self.subTest(snippet=snippet):
                self.assertIn(snippet, self.app)

    def test_product_has_low_friction_share_control(self):
        self.assertIn('id="share"', self.index)
        self.assertIn('Share this tool', self.index)
        self.assertIn('id="copy-share-blurb"', self.index)
        self.assertIn('Copy share blurb', self.index)
        self.assertIn('navigator.share', self.app)
        self.assertIn('navigator.clipboard.writeText', self.app)
        self.assertIn('shareBlurb', self.app)
        self.assertIn('not a spam blast', self.app)
        self.assertIn('https://quarkassistant.github.io/resume-reality-check/', self.app)

    def test_public_surfaces_include_required_ai_footer(self):
        readme = (ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn(self.REQUIRED_FOOTER, self.index)
        self.assertIn(self.REQUIRED_FOOTER, self.app)
        self.assertIn(self.REQUIRED_FOOTER, readme)

    def test_optional_job_post_keyword_gap_is_local_and_visible(self):
        self.assertIn('id="job-post"', self.index)
        self.assertIn('Job post text', self.index)
        self.assertIn('local ATS-style keyword gap', self.index)
        self.assertIn('function keywordGap(resumeText, jobText)', self.app)
        self.assertIn('Keyword gap from the job post', self.app)
        self.assertIn('sampleJob', self.app)
        self.assertIn("document.getElementById('job-post').value = ''", self.app)

    def test_report_starts_with_fit_snapshot_and_priority_fix_list(self):
        self.assertIn('function buildFitSnapshot(a, gap)', self.app)
        self.assertIn('Applicant fit snapshot', self.app)
        self.assertIn('Priority fixes', self.app)
        self.assertIn('fit-score', self.app)
        self.assertIn('fit-checks', self.app)
        self.assertIn('Keyword overlap', self.app)
        self.assertIn('Metrics proof', self.app)
        self.assertIn('Action verbs', self.app)
        self.assertIn('Weak filler', self.app)
        self.assertIn('plainList(\'Priority fixes\'', self.app)

    def test_5_minute_apply_plan_is_generated_and_copyable(self):
        self.assertIn('5-minute apply plan', self.app)
        self.assertIn('function buildActionPlan(', self.app)
        self.assertIn('id="copy-plan"', self.app)
        self.assertIn('function copyActionPlan()', self.app)
        self.assertIn('navigator.clipboard.writeText(lastActionPlanText)', self.app)
        self.assertIn('Pasteable recruiter note', self.app)

    def test_top_third_rewrite_packet_is_generated_and_copyable(self):
        for snippet in [
            'copyable top-third rewrite packet',
            'function buildTopThirdPacket(target, analysis, gap)',
            'function renderTopThirdPacket(topThirdPacket)',
            'id="copy-top-third"',
            'Copy top-third packet',
            'navigator.clipboard.writeText(lastTopThirdText)',
            'Keyword guardrail:',
            'buildPlainReport({ target, snapshot, hits, kills, gap, rewrites, rewriteLab, topThirdPacket, actionPlan })',
        ]:
            with self.subTest(snippet=snippet):
                self.assertIn(snippet, self.app)
        self.assertIn('top-third rewrite packet', self.index)

    def test_bullet_rewrite_lab_generates_local_proof_first_alternatives(self):
        self.assertIn('id="bullet"', self.index)
        self.assertIn('Weak bullet to rewrite', self.index)
        self.assertIn('without inventing facts', self.index)
        for snippet in [
            'const sampleBullet',
            'function buildRewriteLab({ target, bullet, analysis, gap })',
            'Bullet rewrite lab',
            'Outcome-first:',
            "document.getElementById('bullet').value = sampleBullet",
            "document.getElementById('bullet').value = ''",
            'rewriteLabHtml',
            'buildPlainReport({ target, snapshot, hits, kills, gap, rewrites, rewriteLab, topThirdPacket, actionPlan })',
        ]:
            with self.subTest(snippet=snippet):
                self.assertIn(snippet, self.app)

    def test_robots_and_sitemap_exist_for_the_live_product_url(self):
        robots = (ROOT / "robots.txt").read_text(encoding="utf-8")
        sitemap = (ROOT / "sitemap.xml").read_text(encoding="utf-8")
        self.assertIn("Sitemap: https://quarkassistant.github.io/resume-reality-check/sitemap.xml", robots)
        self.assertIn("https://quarkassistant.github.io/resume-reality-check/", sitemap)
        self.assertIn("<changefreq>daily</changefreq>", sitemap)


if __name__ == "__main__":
    unittest.main()
