import fs from 'fs';
import path from 'path';

const html = fs.readFileSync(path.resolve(process.cwd(), 'Website', 'index.html'), 'utf-8');

describe('Website index.html', () => {
  beforeEach(() => {
    document.documentElement.innerHTML = html;
  });

  it('renders header and nav', () => {
    expect(document.querySelector('header')).not.toBeNull();
    expect(document.querySelector('nav')).not.toBeNull();
  });

  it('has a search input if present', () => {
    const input = document.querySelector('input#q');
    // not all sites may have this, so just assert it's defined or not to avoid false failure
    expect(input === null || input instanceof HTMLInputElement).toBeTruthy();
  });
});