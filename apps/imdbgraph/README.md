docker run --rm -p 4321:4321 -e DATABASE_URL="postgresql://test:test@localhost:5432/test" imdbgraph:test

docker build -f apps/imdbgraph/Dockerfile.new -t imdbgraph:test .
