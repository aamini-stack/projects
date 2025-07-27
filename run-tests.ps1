docker build -t dota-visualizer-e2e:latest -f apps/dota-visualizer-e2e/Dockerfile .
docker run -it --rm --network host -v ${PWD}/apps/dota-visualizer-e2e/src:/app/apps/dota-visualizer-e2e/src dota-visualizer-e2e:latest

# docker build -t imdbgraph-e2e:latest -f apps/imdbgraph-e2e/Dockerfile .
# docker run -it --rm --network host -v ${PWD}/apps/imdbgraph-e2e/src:/app/apps/imdbgraph-e2e/src imdbgraph-e2e:latest

# docker build -t portfolio-e2e:latest -f apps/portfolio-e2e/Dockerfile .
# docker run -it --rm --network host -v ${PWD}/apps/portfolio-e2e/src:/app/apps/portfolio-e2e/src portfolio-e2e:latest
