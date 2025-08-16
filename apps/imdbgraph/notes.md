# Notes/TODO

- 08/14/25: Finish tweaking search query. Migrate to ts_vectors and work on
filtering shows with no ratings:

SELECT *, ts_rank(to_tsvector(title), to_tsquery('Star')) as rank
FROM public.show 
WHERE to_tsvector('english', title) @@ plainto_tsquery('english', 'Avatar')
ORDER BY rank DESC

SELECT COUNT(*) FROM public.show
WHERE imdb_id in (SELECT show_id as imdb_id FROM public.episode)
