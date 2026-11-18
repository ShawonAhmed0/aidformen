-- =============================================================================
-- Aid For Men Foundation — hero button: "Our Journey"
-- =============================================================================
-- The About page is now titled "Our Journey" (আমাদের পথচলা). The homepage
-- hero's primary button links there, but its label is stored content
-- ("Know About US" / "আমাদের সম্পর্কে জানুন"), so it has to be changed here or
-- in /admin/hero — either does the same thing.
--
-- Only touches the button when it still points at the About page, so a
-- button an editor has since pointed somewhere else keeps its own label.
-- Safe to re-run.
-- =============================================================================

update public.hero_content
set primary_cta_label    = 'আমাদের পথচলা',
    primary_cta_label_en = 'Our Journey'
where coalesce(btrim(primary_cta_href), '') in ('', '/about', '/bn/about', '/en/about');
