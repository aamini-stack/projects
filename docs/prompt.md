I'm trying to work on a new website that randomly generates new fruits to try. I want to come up with a good algorithm to randomly select from a list of fruits. I have a few critera:

1. The algorithm should pick n fruits (n can vary between generations) to add up to a certain serving size amount. For example, if I want 2 servings of fruit per day for a week, the algorithm sould pick n fruits that add up to roughly x = 14.

2. The algorithm should favor fruits that are in season.

3. The algorithm should pick fruits with a relatively even amount of vitamins/minerals. It shouldn't pick fruits that excessively favor some nutrients and neglects others.

4. I want a way to adjust the variety. If the user picks low variety then it might just suggest a large amount of 2 or 3 fruits. If they want large variety then it will pick a small sample of a large variety of different fruits.

I've been learning about the https://en.wikipedia.org/wiki/Metropolis%E2%80%93Hastings_algorithm. Would this be a good candidate for the problem I'm trying to solve?
