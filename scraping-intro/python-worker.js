// Runs only in a module worker, created on the learner's first Run click.
import { loadPyodide } from 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs';

const baseUrl = new URL('./', self.location.href).href;
let runtime;
let activeId;
let outputSize = 0;

function output(text) {
  const limit = 40000;
  if (outputSize >= limit) return;
  const chunk = `${text}\n`.slice(0, limit - outputSize);
  outputSize += chunk.length;
  self.postMessage({ id: activeId, type: 'output', text: chunk });
  if (outputSize === limit) self.postMessage({ id: activeId, type: 'output', text: '\n[Output limit reached. Stop the code if it keeps running.]\n' });
}

async function initialize() {
  const py = await loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/' });
  await py.loadPackage(['requests', 'beautifulsoup4']);
  py.setStdout({ batched: output });
  py.setStderr({ batched: output });
  py.globals.set('_course_base', baseUrl);
  py.runPython(`
import json as _json
import requests as _requests
from urllib.parse import urljoin as _urljoin
from bs4 import BeautifulSoup as _BeautifulSoup
from bs4.element import Tag as _Tag

_course_listings = [_urljoin(_course_base, f'practice/frogs-{page}.html') for page in (1, 2, 3)]
_course_listing = _course_listings[0]
_course_first_names = ["Common frog", "American bullfrog", "Spring peeper", "Red-eyed tree frog", "Australian green tree frog", "Golden poison frog", "Goliath frog", "Southern corroboree frog", "Wallace's flying frog", "Cranwell's horned frog"]
_course_first_families = ["Ranidae", "Ranidae", "Hylidae", "Hylidae", "Pelodryadidae", "Dendrobatidae", "Conrauidae", "Myobatrachidae", "Rhacophoridae", "Ceratophryidae"]
_course_first_paths = ["frog-rana-temporaria.html", "frog-lithobates-catesbeianus.html", "frog-pseudacris-crucifer.html", "frog-agalychnis-callidryas.html", "frog-pelodryas-caerulea.html", "frog-phyllobates-terribilis.html", "frog-conraua-goliath.html", "frog-pseudophryne-corroboree.html", "frog-rhacophorus-nigropalmatus.html", "frog-ceratophrys-cranwelli.html"]
_course_first_details = [_urljoin(_course_listing, path) for path in _course_first_paths]
_course_all_paths = ["frog-rana-temporaria.html", "frog-lithobates-catesbeianus.html", "frog-pseudacris-crucifer.html", "frog-agalychnis-callidryas.html", "frog-pelodryas-caerulea.html", "frog-phyllobates-terribilis.html", "frog-conraua-goliath.html", "frog-pseudophryne-corroboree.html", "frog-rhacophorus-nigropalmatus.html", "frog-ceratophrys-cranwelli.html", "frog-rana-arvalis.html", "frog-lithobates-pipiens.html", "frog-lithobates-palustris.html", "frog-lithobates-sylvaticus.html", "frog-hyla-cinerea.html", "frog-dryophytes-versicolor.html", "frog-pseudacris-regilla.html", "frog-hyla-arborea.html", "frog-pelodryas-splendida.html", "frog-sandyrana-infrafrenata.html", "frog-rana-dalmatina.html", "frog-pelophylax-ridibundus.html", "frog-pelophylax-lessonae.html", "frog-pelophylax-perezi.html", "frog-ranoidea-aurea.html", "frog-dendrobates-tinctorius.html", "frog-oophaga-pumilio.html", "frog-dendrobates-auratus.html", "frog-epipedobates-tricolor.html", "frog-hyalinobatrachium-fleischmanni.html"]
_course_all_names = ["Common frog", "American bullfrog", "Spring peeper", "Red-eyed tree frog", "Australian green tree frog", "Golden poison frog", "Goliath frog", "Southern corroboree frog", "Wallace's flying frog", "Cranwell's horned frog", "Moor frog", "Northern leopard frog", "Pickerel frog", "Wood frog", "American green tree frog", "Gray treefrog", "Pacific tree frog", "European tree frog", "Magnificent tree frog", "White-lipped tree frog", "Agile frog", "Marsh frog", "Pool frog", "Perez's frog", "Green and golden bell frog", "Dyeing poison dart frog", "Strawberry poison dart frog", "Green and black poison dart frog", "Phantasmal poison frog", "Fleischmann's glass frog"]
_course_all_details = [_urljoin(_course_listings[index // 10], path) for index, path in enumerate(_course_all_paths)]
_course_allowed = {*_course_listings, *_course_all_details}
_course_fetched = []
_course_exercise = ''
_course_original_send = _requests.sessions.Session.send

_course_exercise_needs = {
    'heading': 'the Common frog detail page',
    'single': 'the first practice listing and the Common frog detail page',
    'listing': 'the first practice listing',
    'details': 'the first practice listing and its ten detail pages',
    'stretch': 'the three practice listing pages only; a repeated first-listing request is fine',
}

def _course_send(session, request, **kwargs):
    if request.method != 'GET' or request.url not in _course_allowed:
        raise ValueError('This exercise only fetches the practice frog pages. Use the supplied URLs and links from those pages.')
    if len(_course_fetched) >= 20:
        needs = _course_exercise_needs.get(_course_exercise, 'a few practice pages')
        raise ValueError(f'Request limit reached for this run. This exercise needs {needs}; check your loop.')
    _course_fetched.append(request.url)
    return _course_original_send(session, request, **kwargs)

def _course_check(kind, values):
    checks = []
    def check(ok, message):
        checks.append({'ok': bool(ok), 'message': message})
    def sequence(key):
        found = values.get(key)
        return list(found) if isinstance(found, (list, tuple)) else None
    def text_of(element):
        return element.get_text(strip=True) if isinstance(element, _Tag) else None
    def href_of(element):
        href = element.get('href') if isinstance(element, _Tag) else None
        return href if isinstance(href, str) else None
    def detail_rows(key, expected):
        records = sequence(key)
        return records if records is not None and len(records) == expected and all(isinstance(row, dict) for row in records) else None

    if kind == 'heading':
        check(_course_first_details[0] in _course_fetched,
              'Fetch Common frog’s detail page with requests.get() before selecting from it.')
        heading = values.get('heading')
        check(isinstance(heading, _Tag) and heading.name == 'h1' and text_of(heading) == _course_first_names[0],
              'Set heading to the h1 element whose text is Common frog. Do not choose its parent or the scientific name.')
        check(values.get('name') == _course_first_names[0],
              'Set name to the extracted text Common frog, not the element itself.')

    elif kind == 'single':
        check(_course_listing in _course_fetched and _course_first_details[0] in _course_fetched,
              'Fetch the first practice listing, then Common frog’s detail page. Selecting a link does not fetch it.')
        links = sequence('links')
        has_ten = links is not None and len(links) == 10
        check(has_ten, 'Select exactly ten frog link elements into links.')
        anchors = has_ten and all(isinstance(link, _Tag) and link.name == 'a' for link in links)
        destinations = anchors and [_urljoin(_course_listing, href_of(link) or '') for link in links] == _course_first_details
        names = anchors and [text_of(link) for link in links] == _course_first_names
        check(anchors and destinations and names,
              'Select the ten links, not the cards around them. Check the tag, text and href of the first match.')
        link = values.get('link')
        check(anchors and link is links[0],
              'Set link to links[0]. The first frog link should point at Common frog.')
        check(text_of(link) == _course_first_names[0],
              'Extract frog from the selected link’s text: Common frog.')
        check(values.get('frog') == _course_first_names[0],
              'Set frog to the selected link’s text: Common frog, not the element or an attribute value.')
        check(href_of(link) == _course_first_paths[0],
              'Extract href from the link’s attribute. It is the relative destination, not the full page text.')
        check(values.get('href') == _course_first_paths[0],
              'Set href to the link’s relative href attribute: frog-rana-temporaria.html, not the full URL or an element.')
        check(values.get('detail_url') == _course_first_details[0],
              'Resolve the link’s href against the listing URL so detail_url is the full Common frog page URL.')
        check(values.get('family') == _course_first_families[0],
              'Extract family from the detail page: Ranidae, not the frog heading or the scientific name.')

    elif kind == 'listing':
        check(_course_listing in _course_fetched,
              'Fetch the first practice listing with requests.get().')
        links = sequence('links')
        has_ten = links is not None and len(links) == 10
        check(has_ten, 'Select exactly ten frog links into links.')
        anchors = has_ten and all(isinstance(link, _Tag) and link.name == 'a' for link in links)
        destinations = anchors and [_urljoin(_course_listing, href_of(link) or '') for link in links] == _course_first_details
        names = anchors and [text_of(link) for link in links] == _course_first_names
        check(anchors and destinations and names,
              'Select link elements with names and href destinations, not their surrounding cards. Inspect the first match.')

    elif kind == 'details':
        check(set([_course_listing, *_course_first_details]).issubset(_course_fetched),
              'Fetch the listing, then each of the ten detail pages. Parse each new response.')
        records = detail_rows('records', 10)
        check(records is not None,
              'Keep ten rows in records: one dictionary for each frog on page 1, in listing order.')
        if records is not None:
            check(all({'frog', 'family', 'source_url'} <= set(row) for row in records),
                  'Each row needs frog, family and source_url. Add the missing key to every row.')
            check([row.get('frog') for row in records] == _course_first_names,
                  'Use the listing’s frog names in page-1 order, not the scientific names or the families.')
            families = [row.get('family') for row in records]
            check(not [number for number, family in enumerate(families, 1) if family in (None, '')],
                  'Every frog page has a family. An empty family means the match or extraction failed: inspect Common frog’s page and compare it with your selector.')
            check(families == _course_first_families,
                  'Extract the family value from each detail page, not the heading. Common frog is Ranidae; Spring peeper is Hylidae.')
            urls = [row.get('source_url') for row in records]
            check(len(set(map(str, urls))) == 10,
                  'Give each row its own detail-page source_url. Ten unique URLs are what identify ten records.')
            check(urls == _course_first_details,
                  'Use the resolved detail URL for each frog, in page-1 order. The listing URL is not the source of a family.')

    elif kind == 'stretch':
        listings = sequence('listing_urls')
        check(listings is not None and len(listings) == 3 and listings == _course_listings,
              'Put the three resolved listing-page URLs in listing_urls, in page order. Resolve each pagination href first.')
        check(set(_course_listings).issubset(_course_fetched),
              'Fetch all three listing pages before building the 30 rows.')
        check(set(_course_fetched).issubset(_course_listings),
              'This stretch only requests the three listing pages. Collect names and detail URLs; do not request the detail pages.')
        records = detail_rows('records', 30)
        check(records is not None,
              'Keep 30 rows in records: ten frogs from each listing page, in page order.')
        if records is not None:
            check(all({'frog', 'source_url'} <= set(row) for row in records),
                  'Each row needs frog and source_url. Add the missing key to every row.')
            check([row.get('frog') for row in records] == _course_all_names,
                  'Collect the frog names in listing order, pages 1 to 3, without duplicates or missing pages.')
            urls = [row.get('source_url') for row in records]
            check(len(set(map(str, urls))) == 30,
                  'Each of the 30 frogs needs its own detail URL, even though the stretch does not request it.')
            check(urls == _course_all_details,
                  'Resolve each listing link against the listing page it came from, in page order.')

    return _json.dumps(checks)
`);
  return py;
}

self.onmessage = async ({ data }) => {
  activeId = data.id;
  outputSize = 0;
  let namespace;
  try {
    if (!runtime) runtime = initialize();
    const py = await runtime;
    self.postMessage({ id: activeId, type: 'running' });
    py.globals.set('_course_exercise', data.exercise);
    py.runPython('_course_fetched.clear(); _requests.sessions.Session.send = _course_send');
    namespace = py.toPy({ BASE_URL: baseUrl, __name__: '__main__' });
    const value = await py.runPythonAsync(data.code, { globals: namespace });
    if (value && typeof value.destroy === 'function') value.destroy();
    const checker = py.globals.get('_course_check');
    let checks;
    try { checks = JSON.parse(checker(data.exercise, namespace)); }
    finally { checker.destroy(); }
    self.postMessage({ id: activeId, type: 'done', checks });
  } catch (error) {
    self.postMessage({ id: activeId, type: 'error', message: error.message || String(error) });
  } finally {
    if (namespace) namespace.destroy();
  }
};
