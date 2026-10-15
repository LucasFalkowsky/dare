import { buildPrincipleCommentBody } from './principleComment';

describe('buildPrincipleCommentBody', () => {
  it('Given a principle, When the body is built, Then the name is the heading and category plus keywords follow on one line', () => {
    const body = buildPrincipleCommentBody('P002_sustainability');
    const lines = body.split('\n');

    expect(lines[0]).toBe('### 📌 Sustainability');
    expect(lines[1]).toBe('**Beneficence** — Sustainability, environmental impacts, resources, energy');
  });

  it('Given a principle, When the body is built, Then id and related principles sit in the footer rather than in their own sections', () => {
    const body = buildPrincipleCommentBody('P002_sustainability');

    expect(body).toContain('<sub>DARE · `P002_sustainability` · DARE guidance · Related: Beneficence · Non-Maleficence</sub>');
    expect(body).not.toContain('###  In Practice');
    expect(body).not.toContain('Related Principles');
  });

  it('Given no project interpretation, When the body is built, Then the generic guidance carries the paragraph', () => {
    const body = buildPrincipleCommentBody('P008_justice');

    expect(body).toContain('Justice has many dimensions.');
    expect(body).toContain('DARE guidance');
  });

  it.each([null, undefined, '', '   '])('Given a project interpretation of %p, When the body is built, Then it falls back to the generic guidance', (context) => {
    const body = buildPrincipleCommentBody('P008_justice', context);

    expect(body).toContain('Justice has many dimensions.');
    expect(body).toContain('DARE guidance');
  });

  it('Given a project interpretation, When the body is built, Then it replaces the generic guidance instead of being appended', () => {
    const body = buildPrincipleCommentBody('P008_justice', 'We audit the ranking monthly.');

    expect(body).toContain('We audit the ranking monthly.');
    expect(body).not.toContain('Justice has many dimensions.');
    expect(body).toContain('Project interpretation');
    expect(body).not.toContain('DARE guidance');
  });

  it('Given a principle with many keywords, When the body is built, Then the keyword line is cut instead of running on', () => {
    const body = buildPrincipleCommentBody('P008_justice');
    const keywords = body.split('\n')[1];

    expect(keywords).toContain('…');
    expect(keywords.split(',').length).toBe(6);
    expect(keywords).not.toContain('participation');
  });

  it('Given a locale, When the body is built, Then the content follows that locale', () => {
    const body = buildPrincipleCommentBody('P002_sustainability', undefined, 'de');

    expect(body).not.toContain('### 📌 Sustainability');
    expect(body.split('\n')[0]).toMatch(/^### 📌 .+/);
  });

  it('Given the comment must stay skimmable, When the body is built, Then it is at most eight lines and holds no horizontal rule', () => {
    for (const id of ['P001_beneficence', 'P005_autonomy', 'P009_solidarity']) {
      const body = buildPrincipleCommentBody(id, 'Some project context.');

      expect(body.split('\n').length).toBeLessThanOrEqual(8);
      expect(body).not.toContain('---');
    }
  });

  it('Given a principle, When the body is built, Then it does not list itself as related', () => {
    const body = buildPrincipleCommentBody('P008_justice');
    const footer = body.split('Related:')[1] ?? '';

    expect(footer).toContain('Solidarity');
    expect(footer).not.toContain('Justice');
  });
});
