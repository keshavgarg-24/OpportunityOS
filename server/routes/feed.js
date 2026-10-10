import express from 'express';

const router = express.Router();
const CACHE_MS = 60 * 60 * 1000;
let cachedFeed;
let cachedAt = 0;

const decodeXml = (value = '') => value
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&')
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'");

const plainText = (value = '') => decodeXml(value)
  .replace(/<[^>]*>/g, ' ')
  .replace(/&#\d+;/g, ' ')
  .replace(/\s+([,.;!?])/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  return response.json();
};

const fetchXml = async (url) => {
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Source returned HTTP ${response.status}`);
  return response.text();
};

const readXmlTag = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeXml(match[1]).trim() : '';
};

const fetchFindwork = async () => {
  const apiToken = process.env.FINDWORK_API_TOKEN?.trim();
  if (!apiToken) throw new Error('FINDWORK_API_TOKEN is not configured on the server.');

  const jobs = [];
  let nextUrl = new URL('https://findwork.dev/api/jobs/');
  nextUrl.searchParams.set('page', '1');
  let pagesFetched = 0;

  while (nextUrl && pagesFetched < 5) {
    if (nextUrl.origin !== 'https://findwork.dev' || nextUrl.pathname !== '/api/jobs/') {
      throw new Error('Findwork returned an invalid pagination URL.');
    }
    const data = await fetchJson(nextUrl, {
      headers: {
        Accept: 'application/json',
        Authorization: `Token ${apiToken}`,
      },
    });
    if (!Array.isArray(data.results)) {
      throw new Error('Findwork returned an unexpected jobs response.');
    }
    jobs.push(...data.results);
    pagesFetched += 1;

    if (!data.next) {
      nextUrl = null;
    } else {
      const candidateUrl = new URL(data.next, nextUrl);
      if (candidateUrl.origin !== 'https://findwork.dev' || candidateUrl.pathname !== '/api/jobs/') {
        throw new Error('Findwork returned an invalid pagination URL.');
      }
      nextUrl = candidateUrl;
    }
  }

  return jobs.map((job) => {
    const title = plainText(job.role || job.title || '');
    const tags = Array.isArray(job.tags) ? job.tags.map(plainText).filter(Boolean) : [];
    const isInternship = /\b(intern|internship)\b/i.test(title)
      || tags.some((tag) => /\bintern(ship)?\b/i.test(tag));
    if (isInternship) tags.push('Internship');

    return {
      id: `findwork-${job.id || job.slug || job.url}`,
      title,
      company: plainText(job.company_name || job.company || 'Company not listed'),
      type: isInternship ? 'Internship' : 'Job',
      loc: job.remote ? 'Remote' : plainText(job.location || 'Location not listed'),
      deadline: 'See listing',
      tags: [...new Set(tags)],
      link: job.url || job.application_url || '',
      description: plainText(job.text || job.description || '').slice(0, 1200),
      source: 'Findwork',
      sourceUrl: 'https://findwork.dev/',
    };
  }).filter((job) => job.title && job.link);
};

const fetchGitHubIssues = async () => {
  const url = new URL('https://api.github.com/search/issues');
  url.searchParams.set('q', 'is:issue is:open label:"good first issue"');
  url.searchParams.set('sort', 'updated');
  url.searchParams.set('order', 'desc');
  url.searchParams.set('per_page', '100');
  const data = await fetchJson(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'OpportunityOS',
    },
  });
  if (!Array.isArray(data.items)) {
    throw new Error('GitHub returned an unexpected issues response.');
  }

  return data.items.map((issue) => {
    const repositoryUrl = typeof issue.repository_url === 'string'
      ? issue.repository_url.replace('https://api.github.com/repos/', 'https://github.com/')
      : '';
    return {
      id: `github-${issue.id}`,
      title: plainText(issue.title || ''),
      company: repositoryUrl ? new URL(repositoryUrl).pathname.slice(1) : 'GitHub repository',
      type: 'Open Source',
      loc: 'Remote',
      deadline: 'Open issue',
      tags: [...new Set([
        'Good first issue',
        ...(Array.isArray(issue.labels)
          ? issue.labels
            .map((label) => plainText(label.name || ''))
            .filter((label) => label && !/^good first issue$/i.test(label))
          : []),
      ])],
      link: issue.html_url || '',
      description: plainText(issue.body || '').slice(0, 1200),
      source: 'GitHub',
      sourceUrl: repositoryUrl || 'https://github.com/',
    };
  }).filter((issue) => issue.title && issue.link);
};

const fetchArbeitnow = async () => {
  const data = await fetchJson('https://www.arbeitnow.com/api/job-board-api');
  if (!Array.isArray(data.data)) {
    throw new Error('Arbeitnow returned an unexpected jobs response.');
  }

  return data.data.map((job) => {
    const title = plainText(job.title || '');
    const tags = Array.isArray(job.tags) ? job.tags.map(plainText).filter(Boolean) : [];
    const jobTypes = Array.isArray(job.job_types) ? job.job_types.map(plainText) : [];
    const isInternship = /\b(intern|internship)\b/i.test(title)
      || jobTypes.some((type) => /\bintern(ship)?\b/i.test(type));
    if (isInternship) tags.push('Internship');

    return {
      id: `arbeitnow-${job.slug}`,
      title,
      company: plainText(job.company_name || 'Company not listed'),
      type: isInternship ? 'Internship' : 'Job',
      loc: job.remote ? 'Remote' : plainText(job.location || 'Location not listed'),
      deadline: 'See listing',
      tags: [...new Set(tags)],
      link: job.url || '',
      description: plainText(job.description || '').slice(0, 1200),
      source: 'Arbeitnow',
      sourceUrl: 'https://www.arbeitnow.com/',
    };
  }).filter((job) => job.title && job.link);
};

const fetchAdzuna = async () => {
  const appId = process.env.ADZUNA_APP_ID?.trim();
  const appKey = process.env.ADZUNA_APP_KEY?.trim();
  if (!appId || !appKey) {
    throw new Error('ADZUNA_APP_ID and ADZUNA_APP_KEY are not configured on the server.');
  }

  const url = new URL('https://api.adzuna.com/v1/api/jobs/in/search/1');
  url.searchParams.set('app_id', appId);
  url.searchParams.set('app_key', appKey);
  url.searchParams.set('results_per_page', '50');
  url.searchParams.set('content-type', 'application/json');
  const data = await fetchJson(url);
  if (!Array.isArray(data.results)) {
    throw new Error('Adzuna returned an unexpected jobs response.');
  }

  return data.results.map((job) => {
    const title = plainText(job.title || '');
    const category = plainText(job.category?.label || '');
    const contractType = plainText(job.contract_type || '');
    const contractTime = plainText(job.contract_time || '');
    const isInternship = /\b(intern|internship)\b/i.test(title)
      || /\bintern(ship)?\b/i.test(contractType)
      || /\bintern(ship)?\b/i.test(contractTime);
    const tags = [category, contractType, contractTime].filter(Boolean);
    if (isInternship) tags.push('Internship');
    const salary = job.salary_min || job.salary_max
      ? `Salary: ${[job.salary_min, job.salary_max].filter(Boolean).join(' - ')}${job.salary_is_predicted ? ' (estimated)' : ''}`
      : '';

    return {
      id: `adzuna-${job.id}`,
      title,
      company: plainText(job.company?.display_name || 'Company not listed'),
      type: isInternship ? 'Internship' : 'Job',
      loc: plainText(job.location?.display_name || 'India'),
      deadline: 'See listing',
      tags: [...new Set(tags)],
      link: job.redirect_url || '',
      description: [plainText(job.description || '').slice(0, 1200), salary].filter(Boolean).join(' • '),
      source: 'Adzuna',
      sourceUrl: 'https://www.adzuna.in/',
    };
  }).filter((job) => job.title && job.link);
};

const fetchLinkedInJobs = async () => {
  const apiKey = process.env.LINKEDIN_RAPIDAPI_KEY?.trim();
  if (!apiKey) {
    throw new Error('LINKEDIN_RAPIDAPI_KEY is not configured on the server.');
  }

  const url = new URL('https://linkedin-job-search-api.p.rapidapi.com/active-jb');
  url.searchParams.set('limit', '100');
  url.searchParams.set('offset', '0');
  url.searchParams.set('time_frame', '24h');
  url.searchParams.set('description_format', 'text');
  url.searchParams.set('location', 'India');
  const data = await fetchJson(url, {
    headers: {
      'X-RapidAPI-Key': apiKey,
      'X-RapidAPI-Host': 'linkedin-job-search-api.p.rapidapi.com',
    },
  });
  const listings = Array.isArray(data)
    ? data
    : Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.jobs)
        ? data.jobs
        : null;
  if (!listings) {
    throw new Error('LinkedIn Job Search API returned an unexpected jobs response.');
  }

  return listings.map((job) => {
    const asText = (value) => (typeof value === 'string' || typeof value === 'number')
      ? plainText(String(value))
      : '';
    const title = asText(job.title || job.job_title);
    const employmentType = asText(job.employment_type || job.job_employment_type);
    const isInternship = /\b(intern|internship)\b/i.test(title)
      || /\bintern(ship)?\b/i.test(employmentType);
    const tags = [
      employmentType,
      asText(job.seniority_level || job.job_level),
    ].filter(Boolean);
    if (isInternship) tags.push('Internship');
    const rawLocation = job.location || job.job_location || job.location_name
      || job.locations_derived || job.locations;
    const location = Array.isArray(rawLocation)
      ? rawLocation.map((part) => typeof part === 'string'
        ? asText(part)
        : asText(part?.name || part?.city)).filter(Boolean).join(', ')
      : typeof rawLocation === 'object' && rawLocation !== null
        ? [rawLocation.name, rawLocation.city, rawLocation.region, rawLocation.country].map(asText).filter(Boolean).join(', ')
        : asText(rawLocation);
    const organization = job.organization || job.company || job.company_name || job.employer_name;
    const company = asText(organization)
      || asText(organization?.name || organization?.company_name);
    const remote = job.remote_derived === true || job.job_is_remote === true || job.remote === true;
    const link = asText(job.url || job.job_url || job.linkedin_url || job.linkedin_job_url || job.apply_url || job.link);

    return {
      id: `linkedin-${asText(job.id || job.job_id || job.linkedin_job_id) || link || `${title}-${location}`}`,
      title,
      company: company || 'Company not listed',
      type: isInternship ? 'Internship' : 'Job',
      loc: remote ? 'Remote' : location || 'India',
      deadline: 'See listing',
      tags: [...new Set(tags)],
      link,
      description: asText(job.description || job.job_description).slice(0, 1200),
      source: 'LinkedIn',
      sourceUrl: 'https://www.linkedin.com/jobs/',
    };
  }).filter((job) => job.title && job.link);
};

const fetchBrabble = async () => {
  const apiKey = process.env.BRABBLE_API_KEY?.trim();
  if (!apiKey) throw new Error('BRABBLE_API_KEY is not configured on the server.');

  const pageSize = 200;
  const listings = [];
  let offset = 0;
  let total = Infinity;

  while (offset < total) {
    const url = new URL('https://brabble.ai/api/listings');
    url.searchParams.set('hub', 'hackathons');
    url.searchParams.set('limit', String(pageSize));
    url.searchParams.set('offset', String(offset));
    const data = await fetchJson(url, {
      headers: { 'x-api-key': apiKey },
    });
    if (!Array.isArray(data.listings)
      || !Number.isInteger(data.total)
      || !Number.isInteger(data.count)
      || data.count !== data.listings.length
      || data.count === 0 && offset < data.total) {
      throw new Error('Brabble.ai returned an unexpected or incomplete listings page.');
    }

    total = data.total;
    listings.push(...data.listings);
    offset += data.count;
  }

  return listings.map((listing) => {
    const eventDate = new Date(listing.deadline);
    const deadline = Number.isNaN(eventDate.getTime())
      ? 'See listing'
      : `${listing.kind === 'contest' ? 'Starts' : 'Closes'} ${new Intl.DateTimeFormat('en-IN', {
        dateStyle: 'medium',
        timeZone: 'Asia/Kolkata',
      }).format(eventDate)}`;
    const details = [
      listing.platform,
      listing.mode,
      listing.team && `Team: ${listing.team}`,
      listing.fee && `Fee: ${listing.fee}`,
      listing.prize?.label && `Prize: ${listing.prize.label}`,
      ...(Array.isArray(listing.eligibility) ? listing.eligibility : []),
    ].filter(Boolean);

    return {
      id: `brabble-${listing.id}`,
      title: listing.title,
      company: listing.organiser || 'Organizer not listed',
      type: 'Hackathon',
      loc: listing.mode === 'ONLINE'
        ? 'Online'
        : listing.city && listing.city !== 'See listing'
          ? listing.city
          : listing.mode || 'See listing',
      deadline,
      tags: [...new Set([listing.type, listing.platform, listing.mode].filter(Boolean))],
      link: listing.url || '',
      description: details.join(' • '),
      source: 'Brabble.ai',
      sourceUrl: listing.shareUrl || 'https://brabble.ai/',
    };
  }).filter((listing) => listing.title && listing.link);
};

const fetchTheMuse = async () => {
  const data = await fetchJson('https://www.themuse.com/api/public/jobs?page=1&location=India&category=Software%20Engineering');
  return (data.results || []).map((job) => {
    const title = plainText(job.name || job.title || '');
    const detail = plainText(job.contents || '');
    const locations = (job.locations || []).map((location) => location.name).filter(Boolean);
    const levels = (job.levels || []).map((level) => level.name).filter(Boolean);
    const tags = [
      ...(job.categories || []).map((category) => category.name),
      ...levels,
    ].filter(Boolean);
    const isInternship = /\b(intern|internship)\b/i.test(title) || levels.some((level) => /intern/i.test(level));
    if (isInternship) tags.push('Internship');
    return {
      id: `themuse-${job.id}`,
      title,
      company: job.company?.name || 'Company not listed',
      type: isInternship ? 'Internship' : 'Job',
      loc: locations.map(plainText).join(', ') || 'India',
      deadline: 'See listing',
      tags: [...new Set(tags)],
      link: job.refs?.landing_page || '',
      description: detail.slice(0, 1200),
      source: 'The Muse',
      sourceUrl: 'https://www.themuse.com/',
    };
  }).filter((job) => job.title && job.link);
};

const fetchTheMuseInternships = async () => {
  const data = await fetchJson('https://www.themuse.com/api/public/jobs?page=1&category=Software%20Engineering&level=Internship');
  return (data.results || []).map((job) => {
    const title = plainText(job.name || job.title || '');
    const locations = (job.locations || []).map((location) => location.name).filter(Boolean);
    const tags = [
      ...(job.categories || []).map((category) => category.name),
      ...(job.levels || []).map((level) => level.name),
      'Internship',
    ].filter(Boolean);
    return {
      id: `themuse-internship-${job.id}`,
      title,
      company: job.company?.name || 'Company not listed',
      type: 'Internship',
      loc: locations.map(plainText).join(', ') || 'See listing',
      deadline: 'See listing',
      tags: [...new Set(tags)],
      link: job.refs?.landing_page || '',
      description: plainText(job.contents || '').slice(0, 1200),
      source: 'The Muse',
      sourceUrl: 'https://www.themuse.com/',
    };
  }).filter((job) => job.title && job.link);
};

const fetchRemotive = async () => {
  const data = await fetchJson('https://remotive.com/api/remote-jobs?category=software-dev&limit=100');
  return (data.jobs || []).map((job) => {
    const description = plainText(job.description || '');
    const isInternship = /\b(intern|internship)\b/i.test(job.title);
    return {
      id: `remotive-${job.id}`,
      title: plainText(job.title),
      company: plainText(job.company_name || 'Company not listed'),
      type: isInternship ? 'Internship' : 'Job',
      loc: plainText(job.candidate_required_location || 'Remote'),
      deadline: 'See listing',
      tags: (job.tags || []).map(plainText).filter(Boolean),
      link: job.url,
      description: description.slice(0, 1200),
      source: 'Remotive',
      sourceUrl: 'https://remotive.com/',
    };
  }).filter((job) => job.title && job.link);
};

const fetchScholarships = async () => {
  const xml = await fetchXml('https://opportunitydesk.org/feed/');
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)].map(([, item]) => {
    const title = plainText(readXmlTag(item, 'title'));
    const description = plainText(readXmlTag(item, 'description'));
    const link = readXmlTag(item, 'link');
    const categories = [...item.matchAll(/<category(?:\s[^>]*)?>([\s\S]*?)<\/category>/gi)]
      .map(([, category]) => plainText(category));
    const scholarshipPost = /\b(scholarship|fellowship|bursary|financial aid|grant)\b/i.test(`${title} ${categories.join(' ')}`);
    if (!scholarshipPost) return null;
    const deadline = description.match(/\bdeadline\s*:\s*([^.!?]+)/i)?.[1]?.trim() || 'See listing';
    return {
      id: `opportunitydesk-${link}`,
      title,
      company: 'Opportunity Desk',
      type: 'Scholarship',
      loc: categories.filter((category) => /^(Africa|America|Asia|Europe|Australia and Oceania)$/i.test(category)).join(', ') || 'International',
      deadline,
      tags: [...new Set(['Scholarship', ...categories.slice(0, 4)])],
      link,
      description: description.slice(0, 1200),
      source: 'Opportunity Desk',
      sourceUrl: 'https://opportunitydesk.org/',
    };
  }).filter(Boolean);
  return items;
};

router.get('/opportunities', async (req, res) => {
  if (cachedFeed && Date.now() - cachedAt < CACHE_MS) {
    return res.json({ ...cachedFeed, cached: true });
  }

  const sources = [
    ['Brabble.ai Hackathons', fetchBrabble],
    ['GitHub Good First Issues', fetchGitHubIssues],
    ['Findwork Jobs', fetchFindwork],
    ['Adzuna India Jobs', fetchAdzuna],
    ['LinkedIn Jobs', fetchLinkedInJobs],
    ['Arbeitnow Jobs', fetchArbeitnow],
    ['The Muse (India)', fetchTheMuse],
    ['The Muse Internships', fetchTheMuseInternships],
    ['Remotive', fetchRemotive],
    ['Opportunity Desk', fetchScholarships],
  ];
  const results = await Promise.all(sources.map(async ([name, load]) => {
    try {
      return { name, items: await load(), error: null };
    } catch (error) {
      return { name, items: [], error: error.message || 'Could not load this source' };
    }
  }));

  const uniqueItems = new Map();
  results.flatMap((source) => source.items).forEach((item) => {
    if (!uniqueItems.has(item.link)) uniqueItems.set(item.link, item);
  });
  const items = [...uniqueItems.values()];
  const payload = {
    items,
    sources: results.map(({ name, items: sourceItems, error }) => ({
      name,
      count: sourceItems.length,
      error,
    })),
    updatedAt: new Date().toISOString(),
  };

  if (items.length) {
    cachedFeed = payload;
    cachedAt = Date.now();
  }

  if (!items.length) {
    return res.status(502).json({ ...payload, message: 'All opportunity sources are currently unavailable.' });
  }
  return res.json(payload);
});

export default router;
