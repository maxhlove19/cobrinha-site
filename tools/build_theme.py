#!/usr/bin/env python3
"""Rebuild wp/cobrinha-theme.zip from the static site.

    python3 tools/build_theme.py [build_dir]

Every top-level *.html becomes patterns/<slug>.php (its <main>, minus the shared CTA band and
contact strip) plus templates/page-<slug>.html; index.html becomes front-page. The chrome
(skip link, nav, menu / CTA band, contact strip, footer, dock) is cut from index.html into
parts/header.html and parts/footer.html. functions.php and style.css are hand-maintained in
wp/theme/. theme.json's palette and fonts are read from css/site.css so they cannot go stale.
"""
import json, re, shutil, sys, tempfile, zipfile
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
THEME_URI = '<?php echo esc_url( get_template_directory_uri() ); ?>'   # inside patterns (PHP runs)
PART_URI = '/wp-content/themes/cobrinha'                                # inside template parts (plain HTML)
HOME = 'https://maxhlove19.github.io/cobrinha-site/'

TEMPLATE = '''<!-- wp:template-part {"slug":"header","tagName":"header"} /-->
<!-- wp:group {"tagName":"main","layout":{"type":"default"}} -->
<main id="main" class="wp-block-group">
%s
</main>
<!-- /wp:group -->
<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->
'''
PATTERN = '<!-- wp:pattern {"slug":"cobrinha/%s"} /-->'
PROSE = '<!-- wp:group {"className":"wrap prose","style":{"spacing":{"padding":{"top":"64px","bottom":"64px"}}}} --><div class="wp-block-group wrap prose">%s</div><!-- /wp:group -->'
POST = ('<!-- wp:group {"className":"phero","layout":{"type":"constrained"}} --><div class="wp-block-group phero"><div class="wrap"><!-- wp:post-title {"level":1,"className":"display"} /--></div></div><!-- /wp:group -->\n'
        + PROSE % '<!-- wp:post-content /-->')
LOOP = PROSE % ('<!-- wp:query {"queryId":1,"query":{"perPage":10,"postType":"post","inherit":true}} --><div class="wp-block-query"><!-- wp:post-template --><!-- wp:post-title {"isLink":true} /--><!-- wp:post-excerpt /--><!-- /wp:post-template -->'
                '<!-- wp:query-pagination --><!-- wp:query-pagination-previous /--><!-- wp:query-pagination-next /--><!-- /wp:query-pagination --></div><!-- /wp:query -->')


def rewrite(html, base):
    """Static-site URLs -> WordPress URLs: img/ assets to the theme dir, x.html links to /x/."""
    html = html.replace('src="img/', 'src="%s/assets/img/' % base)
    html = re.sub(re.escape(HOME) + r'([\w-]+)\.html', r"<?php echo esc_url( home_url( '/\1/' ) ); ?>", html)
    return re.sub(r'href="([\w-]+)\.html([#?][^"]*)?"',
                  lambda m: 'href="%s%s"' % ('/' if m[1] == 'index' else '/%s/' % m[1], m[2] or ''), html)


def part(chunk):
    return '<!-- wp:html -->\n\n%s\n<!-- /wp:html -->\n' % chunk


def build(out):
    shutil.rmtree(out, ignore_errors=True)
    for d in ('patterns', 'parts', 'templates', 'assets/css', 'assets/js'):
        (out / d).mkdir(parents=True)
    custom = []
    for page in sorted(SITE.glob('*.html')):
        html = page.read_text()
        slug = 'front-page' if page.stem == 'index' else page.stem
        title = re.search(r'<title>(.*?) — ', html)[1]
        body = html[html.index('<main id="main">\n') + len('<main id="main">\n'):html.index('<section class="cta-band')]
        (out / 'patterns' / (slug + '.php')).write_text(
            '<?php\n/**\n * Title: %s\n * Slug: cobrinha/%s\n * Categories: cobrinha\n * Inserter: yes\n */\n?>\n<!-- wp:html -->\n%s<!-- /wp:html -->\n'
            % (title, slug, rewrite(body, THEME_URI)))
        template = slug + '.html' if slug == 'front-page' else 'page-%s.html' % slug
        (out / 'templates' / template).write_text(TEMPLATE % (PATTERN % slug))
        if slug == '404':
            (out / 'templates' / '404.html').write_text(TEMPLATE % (PATTERN % slug))
        if slug != 'front-page':
            custom.append({'name': 'page-' + slug, 'title': title, 'postTypes': ['page']})
        if slug == 'front-page':  # the shared chrome, cut from the home page
            head = html[html.index('<a class="skip"'):html.index('<main id="main">')]
            band = html[html.index('<section class="cta-band'):html.index('</main>')]
            foot = html[html.index('</main>') + len('</main>'):html.index('<script src="js/site.js"')]
            (out / 'parts' / 'header.html').write_text(part(rewrite(head, PART_URI)))
            (out / 'parts' / 'footer.html').write_text(part(rewrite(band + foot, PART_URI)))
    (out / 'templates' / 'index.html').write_text(TEMPLATE % LOOP)
    for t in ('page', 'single'):
        (out / 'templates' / (t + '.html')).write_text(TEMPLATE % POST)

    css = (SITE / 'css' / 'site.css').read_text()
    root = css[:css.index('}')]
    var = dict(re.findall(r'--([\w-]+):(#[0-9A-Fa-f]{6})', root))
    font = lambda key: re.search(r'--%s:([^;]+)' % key, root)[1]
    (out / 'theme.json').write_text(json.dumps({
        '$schema': 'https://schemas.wp.org/trunk/theme.json', 'version': 3,
        'settings': {
            'appearanceTools': True,
            'layout': {'contentSize': '1280px', 'wideSize': '1280px'},
            'color': {'palette': [{'slug': s, 'color': var[v], 'name': n} for s, v, n in (
                ('ink', 'ink', 'Ink'), ('paper', 'paper', 'Paper'), ('mat', 'mat', 'Mat'),
                ('gold', 'gold', 'Alliance gold'), ('muted', 'tx-m', 'Muted'))]},
            'typography': {'fontFamilies': [{'slug': s, 'name': font(k).split(',')[0].strip('"'), 'fontFamily': font(k)}
                                            for s, k in (('display', 'disp'), ('body', 'body'))]}},
        'styles': {'color': {'background': 'var(--paper)', 'text': 'var(--tx)'},
                   'typography': {'fontFamily': 'var(--wp--preset--font-family--body)'}},
        'templateParts': [{'name': 'header', 'area': 'header'}, {'name': 'footer', 'area': 'footer'}],
        'customTemplates': custom}, indent=1))

    for f in ('functions.php', 'style.css'):
        shutil.copy(SITE / 'wp' / 'theme' / f, out / f)
    shutil.copy(SITE / 'css' / 'site.css', out / 'assets' / 'css')
    for f in ('site.js', 'schedule.json'):
        shutil.copy(SITE / 'js' / f, out / 'assets' / 'js')
    shutil.copytree(SITE / 'img', out / 'assets' / 'img', ignore=shutil.ignore_patterns('.*'))

    zpath = SITE / 'wp' / 'cobrinha-theme.zip'
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
        for f in sorted(p for p in out.rglob('*') if p.is_file()):
            z.write(f, 'cobrinha/' + f.relative_to(out).as_posix())
    print('built', zpath, 'from', out)


if __name__ == '__main__':
    build(Path(sys.argv[1]) if len(sys.argv) > 1 else Path(tempfile.mkdtemp()) / 'cobrinha')
