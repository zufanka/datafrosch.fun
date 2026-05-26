## Slides

1. These slides : datafrosch.fun/slides/code-anything| [Download Opencode](https://opencode.ai/download) | [Download Python](https://www.python.org/downloads/)
2. *🤚 Hands-on (5-10min)*: 
   1. open chatgpt, claude or deepseek (chat apps that make interactive artifacts)
   2. prompt it to "make a snake game"
   3. have fun with the prompt, make it poop rainbow, make it a space version
   4. play the game for a bit, then paste a screenshot & the prompt of [your snake game here](https://excalidraw.com/#room=d8ba38d1d9ca3fe3c753,oGvi9P3izyrFfUyBQuSALw)
3. Insert the snake game images, two per slide on separate slides (from slides/img folder)
4. What is happening here?
   - the model knows what 'snake game' is thanks to its training data
   
   - it knows how to make interactive artifacts (javascript)
   
   - however: it will make a lot of arbitrary choices by itself: 
     
     - how does it look?
     
     - how does it behave?
     
     - Does hitting the walls make the game stop?
     
     - Are there obstacles?
     
     - Does the snake have eyes? 

5- We don't want this
6. 1. **Prompt**
   
   2. **Context**
   
   3. **Local agents**
   
   4. **Plan → Implement → Review**
7. **Prompt**
8. `optimal-prompt.webp`| [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
9. `prompt.jpg`
10. ✍️🤖
11. `prompt2.jpg`
12. **Context**
13. making sure the right information is in front of the model at the moment it needs it
14. `context-vs-prompt.png` | [Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
15. No context = Just training data = More hallucinations & arbitrary choices
16. `context.jpg` | [FACTS Benchmark Suite Leaderboard](https://www.kaggle.com/benchmarks/google/facts)
17. 🐍 
18. Core mechanics
    
    > Build a snake game in Python. Represent the snake as a list of (x, y) grid coordinates. It moves by adding a new head in the current direction and removing the tail. Arrow keys change direction. Just a snake crawling on a blank grid, no food, walls, or scoring yet.
19. Basic rules
    
    > We have a snake as a list of (x, y) coordinates that moves by adding a head and removing a tail, with arrow-key control. Now add three rules, keeping that representation: (1) food at a random empty cell, (2) eating food grows the snake by skipping the tail removal that turn, (3) game ends on collision with a wall or itself.
20. Design and polish
    
    > The snake now moves, eats food to grow, and dies on collision. Keep all of that working. Add polish only: a score counter (one point per food), a game-over screen showing the score with a restart key, and simple colors for the snake, food, and background.
21. Good practices:
    1. Discuss the problem with the model
    2. "Ask me questions"
22. The smaller the model the more important it is to divide the work well
23. What is a small model?
24. models.jpg
25. `deepseek-v4.jpg`
26. **Local agents**
27. `free-the-robot.jpg`
28. *🤚What is an agent? (5min)*
    
    Chose *DeepSeek V4 Pro* and use the key: *sk-22e91f2f20cd42398c6a93044ae4ad5a*
    - ask the llm what an agent is
    
    - ask the agent what it can do
    
    - ask the llm what tools it has
29. Do you have the same list? | `tools.jpg`
30. Mind the context!
    
    > Look into the opencode documentation first and then tell me what tools you have
31. **Agent*** = a *model* with a *tool*, having *access to your computer*
32. **Plan - Implement - Review**
    🤚*Make a scraper for [books to scrape](https://books.toscrape.com/)* (15 min)
- *plan*: discuss what needs to happen with the agent - this will minimize random behavior / use plan mode
- *implement*: grab a prompt as an output from the discussion and have the agent implement it / use build mode   
- *review*: 

More resources:

- [coding with small/dumb local models](https://github.com/resolveworks/fork/tree/main/context)