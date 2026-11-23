# English voiceover · From chat to agent

One section per slide, titled with the slide id (`deck/slides/order.json`).
Written to be read aloud: numbers in words, no symbols. An empty section = the slide holds a few
seconds with no voice. Adapted from Pierre's explanations when he first gave the talk, in French, in November 2026.

## cover

Hi, I'm Pierre Bastiani. This talk is called "From chat to agent". It's an introduction to agentic development, and I'll try to take the mystery out of it, one layer at a time.

## plan

We start with the model. No deep details, just the principle. Then the chat, the first harness, the first clean way we found to talk to these models. Then the first tool, which was web search. Then the agentic loop, with permissions. Then skills, which sound mysterious and are really not much at all. Sub-agents, to open up what comes next. And finally what you can set in your own harness, and how to get started. At every step, we rewrite the program in pseudo-code, and we only look at the lines that get added.

## llm-next

To keep it very basic, a language model tries to produce the next word. Here's the sentence: "The nominal supply voltage is three point three". The model outputs a probability for every possible continuation, and picks the highest one. Here it's "V", for volts. That's all the model does. That's all it can do. How does it guess? Math: matrices, weights computed beforehand, statistics over a huge amount of text. But in practice, that's it. A sentence, and the next word.

## llm-next-2

Then it goes back to the start of the loop. It takes the whole sentence again, with the "V", and tries once more to predict the next word. This time it's the plus or minus sign. If you have it write a ten-line paragraph, the loop runs hundreds of times. Nothing is planned ahead. It finds out its sentence while writing it. That's also why it can head in the wrong direction, and keep going with confidence.

## tokens

I lied. The model doesn't predict the next word. It doesn't read words. It reads tokens, a way of cutting words into pieces. It doesn't work at the level of a character, that's too small, and not at the level of a word either. Netlist is a good example: "net" and "list" each carry meaning, and they're two tokens. This is the real split from Llama three point two, a model from Meta with public weights. The same sentence costs sixteen tokens in French and ten in English. So in my example, the model isn't predicting the next word. It's predicting the next token.

## llm-training

A model is trained twice. First, pre-training: thousands of billions of tokens of text. Roughly the whole Internet, scanned books, all public code, scientific papers. What do we do with all that? Take a book, take one page, cut it in half, and ask the model to continue. Then do the math to bring its prediction closer to the real ending. For people in test, machine learning is a test campaign: you look at what matches least, you run it again, and generation after generation, it matches better. Second stage: fine-tuning. We show it conversations in question and answer format, and people rate its answers. It learns that we expect an assistant, one that explains. That was ChatGPT's secret sauce. One more thing: consumer versions may use your conversations to train the next models. Business licenses usually rule that out. It's part of the contract.

## llm-seen

This training explains what the model has seen, and what it has never seen. Verilog, Verilog-AMS, netlists, assembly, Python, Tcl: all public data, it has seen them. A proprietary verification language, though, has a good chance of never having been discussed on the Internet. It has never seen it. Same for your internal communication language, your specs, your design databases, your testbenches and their conventions. What it has never seen, it makes up, with confidence. To work well with it, you'll have to document all of that for it.

## completion

Before ChatGPT, we already had these models, but in raw form, exactly the format I just described. You gave them text: "Question, colon". We know it tries to continue, so if you write "Answer, colon", you can guess it will try to predict an answer. You steer it with the format of the text. The problem: it's used to completing web pages and books. It doesn't stop when you want it to stop. It makes up the next question. At first, that was a real problem. Hence the stop sequence: as soon as it writes "Question", we cut.

## gen-playground

On the left, that era: GPT-3 in the OpenAI Playground. You type text in black to steer it, the model answers in green, and by keeping that format you get question and answer. But it was very limited, you were working in raw text. On the right, the same thing today. You still have access to the raw model, without the chat interface, and the same thing still happens. This model runs on my laptop. Without a stop sequence, it loops. With one, it stops.

## harness-def

The harness is the program around the model, all of that chat interface. You type your question. The harness puts it into text for the model, calls the model, cuts the answer and shows it to you. The model only completes the text it's given. The model is the puppet, and the harness holds the strings. And the model is really limited by its harness. Some teams make big gains on benchmarks just by improving the harness. ChatGPT, Gemini, Antigravity, Claude Code: those are harnesses.

## template

Now we're on the model's side. This is what it receives from your chat interface. A tag to say the user is speaking. The line opens, the line closes. Then we write "assistant", to guide it: you're playing the assistant. It fills in its answer and closes the tag itself. The harness takes what's between the two tags and displays it cleanly. It's not the exact syntax of every model, but it's the idea.

## gen-chat

The chat, from both sides. I picked the old ChatGPT interface, because seeing every generation helped me. On the left, what you see. On the right, what the model sees. The harness only marked that the user is speaking, and where the message ends. And the model reads everything before it: the whole history is in its context. Keep in mind that GPT-3 came out before, and hardly anyone cared, because it wasn't practical. It took off when OpenAI had the idea of a chat interface. With the same model.

## context

The context is everything the model reads in your conversation, and it's measured in tokens. First, the system instruction. When you open a new conversation, the harness already puts in: you are the assistant of this company, your name is this, here are your guidelines. You don't see it, but it's there. Then the documents you pasted, the conversation so far, your question, and the free space. Current models go from a hundred thousand to over a million tokens. A new conversation is a context at zero. It shows up like on its first day, it doesn't even know what your job is. And it doesn't matter whether the conversation is from yesterday or three days ago: its unit is text. The fuller the context, the less relevant it gets, because it struggles to find what was at the start.

## chat-loop

I find that the best way to understand a tool is to code it. That's how I learned at school. If we had to code the chat, the most basic harness: a text variable, and a loop. Read the question from the keyboard. Add "user" and the question to the text, a new line, and "model", again to guide the model. Ask it to complete, and stop as soon as it writes "user". That means it has finished its answer and is starting to make up the next question. Cut, and show the answer. If we had to code the chat, it would be that simple.

## tool-web

Back then, the first tool was web search in ChatGPT. How did we get it to search, when it only sees text? It doesn't open a browser. Even today, it only sees text. So we have it write tags. During fine-tuning, it learned to write a "search" tag. It writes the opening tag, what it wants to search for, and the closing tag. The harness, the small piece of code behind it, takes what's between the two tags and runs the query itself. It does its little Google search, takes the titles and snippets of the first five results, puts them into the text, and calls the model again. The harness drives the model.

## tool-loop

It's the same loop as before. Read the keyboard, the model completes, and we add a second stop sequence, the closing search tag. If the harness sees that the answer ends with that tag, it knows the model wants to search. It runs the search on what the model put between the tags, adds the results to the text, and sends it back to the model: go on, complete, I've put the results in the conversation. Four more lines. And you can see that with this talk, we're building a more and more capable harness, step by step.

## tools-table

Then we added lots of tools, on the same principle. Bash is a tool. The syntax changed, bash with parentheses, but it doesn't matter. The harness spots it, runs the command, and returns the output. Read, write, search: create a file, read a file, very handy abilities. And external tools, plugged in through M.C.P., for example to a spec database. You can see it's the harness that gives the model its abilities. A chat tells you: open a window, copy and paste this. An agent does it.

## loop-diagram

The agentic loop. One, think: the model reads the whole text again and picks a tool, by writing the syntax we saw. Two, act: the harness spots the syntax and runs the call. Three, observe: the tool's result is added to the context. We call the model again with that result, and it starts thinking again. It stops when it stops calling tools. The harness then decides the model is done. The model itself never stops, it just sees text. An agent is just a model with a harness that lets it run this loop. We call it an agent because that's when it started acting on the world.

## cot

Thinking was a big step forward, arriving around the same time as tools: chain of thought. We found that if we gave the model a scratchpad, its answer got much better. Nothing surprising: if you ask me to work out a calculation on paper, that helps me too. So its instructions say: write your reasoning between these tags. And the harness decides whether to show it. It costs more tokens, but the quality gain is large. That scratchpad also helps the teams who monitor models, to see which direction it's taking.

## agent-sides

The agent, from both sides. This is one way it can be displayed. A Claude Code session looks like this, but it depends on your harness. Your question: find the chips out of limits. A tool call, bash. Denied by the permissions: that's when you get the approval prompt, yes or no. It keeps going, next call. That's what a conversation looks like these days. But remember, it's always the same loop: it makes the call, gets the answer, thinks, makes the next call. Fourteen turns, and at the end, an answer.

## loop-pseudo

If we had to code the agentic loop. Before, we only had web search. Now we give it a list of tools. Each tool comes with a short description, and that's part of managing its context: with hundreds of tools, you fill tens of thousands of tokens just explaining what it has, and you pay for every token. We also move up a level of harness: we work on a list of messages, user, model, tool, but in the end, it's just one text. We add the model's reply to the messages. If it calls no tool, that's the final answer: show it and stop. Otherwise, run each call, add the result to the messages, and go back to the top.

## perm-pseudo

Here I quickly added permissions. It's all the same code, what's in orange was just added. The harness manages everything, it manages the calls. Here we decided bash is sensitive: as soon as we see bash, we ask the user, allow? If you say no, instead of the tool's result we put "denied by the user", and the model reads that in the history. It's code, it's deterministic. That's what's good about the harness, unlike the model. Today all of this is configuration, coded much better than my pseudo-code.

## mcp-pseudo

M.C.P., Model Context Protocol. Let's take the mystery out: it's an API, in the right format for agents. An API is one program calling another: give me the content of this order, and it gets back the list of products. M.C.P. is the same, except each call gets a title and a description. That turns API calls into tools, and the harness adds them to the list. Why is that cleaner than letting the agent connect over S.S.H.? Because over S.S.H., it has the same rights as you. With M.C.P., the server manages the rights, and keeps the log: who ran which command, and when. And since the protocol is public, a service like Confluence can publish its M.C.P. server once, and every harness can plug into it.

## markdown

Rules files and skills are written in Markdown, dot M.D. It's just a syntax for writing documentation, and it existed before these models. A hash sign followed by text means a title: the renderer shows it big and bold. Why do we like it? Because it's readable, rendered or not. I can read you the raw text easily, and the rendered version just as easily. And the syntax is short. Remember, we pay in tokens. If we did everything in H.T.M.L., we'd spend tokens just on the tags.

## permissions

Permissions live in the harness. First, the rules file. Remember the system instruction, what the harness puts at the start of every conversation? The rules file is the same, except you choose what goes in. For example: talk to me in plain language, without being too wordy. But it's not deterministic. It's text, directions, and the model can ignore it. You can write "never touch this file", and it can still open it. However, if the harness doesn't give it permission, or if you run the agent as a user who mechanically cannot access that file, then it can't.

## skill-file

A skill, let me take the mystery out: it's a text file. Like everything we've seen so far. A Markdown file, with a name and a short description at the top. And inside, a recipe: follow these steps, do it this way, if I didn't give you the input file, tell me. It's documentation, written the way you'd write it for a coworker, but for an agent. I was writing skills before anyone called them skills: a repetitive task, you document it once, and next time you give it the path to the file. No need to repeat all the context.

## skill-loading

If we had to code skills. When you start a new conversation, the harness takes every name and every description, and puts them in the context. That's all. Nothing changes in the loop: when your request looks like a skill, the agent just calls the read tool on the file's path. The goal is progressive discovery. We don't want to load everything into the context up front. Picture a hundred skills of fifty pages each: your context would be full before you even started. You give it pointers, like you would a coworker, and it decides when to read which document. And you can do the same by hand: read this file, and follow it.

## skill-vs-mcp

So how is that different from M.C.P.? A skill is documentation. There's nothing inside: no tool, no permission handling. An M.C.P. server is a protocol that calls another system, with access rights. The two work together. In a skill, you can write: use the database M.C.P. server to get this piece of information, then run this program, and give me a summary. Writing an M.C.P. server is the job of the team that runs the service and its access. Writing your own skills on top is everyone's job.

## demo-1

On to the demo. I picked an example from chip testing, with made-up data: a lot of two hundred chips, four measurements, and a limits file. I open Claude Code in the folder, with only a one-line rules file. I ask it: find the chips out of limits, and make me an H.T.M.L. report with one chart per measurement and a pass fail table. It makes a bash call to look at the files, writes a Python script to build the report, and runs it. In one minute: nineteen chips failing out of two hundred, a ninety point five percent yield. Then the question production people care about: what's the failure rate at three sigma? Seventeen chips fall outside the window, eight times more than a normal distribution would give. These are real defects. I tell it: put that in the report and regenerate. It gets a path wrong, reads the error, and fixes it on its own. A word of caution: a nice-looking report can be wrong. That's why you stay responsible for the result.

## demo-2

Now the skill demo. We just did a task together, and gave it one correction, the three sigma analysis. I tell it: turn what we just did into a skill, with my correction. It cleans up the Python script, because it plans to store it in the skill. It tidies it so it works on other lots, and tests it on a second lot. The skill has two files: the dot M.D. file, the recipe, and a script that builds the H.T.M.L. My correction is in: the three sigma analysis is always in the report.

## demo-3

I quit the conversation and open a new one, in another product's folder. Remember: it has nothing left. And I'm deliberately vague: let's make an H.T.M.L. report of the files in this folder. I don't say which file, or which format. It still understood, because the skill's name means lot report, and its description was in the context. It reads the skill and runs the script, without rewriting anything. Seventeen fails out of a hundred and fifty, an eighty-eight point seven percent yield, with the three sigma analysis. The conversation is much shorter: it reused the work from the previous session, so we saved tokens. But imagine using it carelessly: always check which skill it used.

## deterministe

A skill is not like Python. It's Markdown, it's not deterministic. The model can give you a different layout from one time to the next. But when you don't need intelligence, whenever I can, I make the task deterministic. To build its report, it wrote a script: that part is deterministic. We store the script in the skill, and next time we just ask it to use it. The harness, the permissions, a script, an account with no access: those always do the same thing. The model, the rules file, the skill: those can vary.

## own-language

Same principle for your internal languages. Here's a made-up language, which means nothing to the model, since it never saw it in training. Without a skill, it makes up a plausible syntax, probably wrong. For your languages, you have a long conversation with it to explain, with lots of examples, and you generate the skill from that. Or you put it straight into your rules file, it's your call. If you work with that language all the time, it needs to be in context all the time. Otherwise, a skill. These are trade-offs, and I'm just giving you the tools.

## subagent

If we had to code a sub-agent. So far, we've talked about an agent that expects a human to answer it. We turn the loop we saw into a function, and the first agent can call a second one, with a maximum depth so it doesn't go off in every direction. What's it for? You want to avoid filling the context of your main session. You have a task that's bounded and well defined, but a bit long. You ask your agent to start a sub-agent, which gets its own conversation, and only sends back its conclusion. This is just to open the door: nothing stops you from going up another level.

## bridge

The model only knows what the harness makes it read. Your skills, your access and your settings decide what it reads.

## your-tools

Common tools, sorted by step. ChatGPT, Gemini or Claude for general questions: that's chat, step two. With files attached, still chat: the files are pasted into the text, it's not agentic yet. An assistant inside your documents, like Gemini in Google Sheets: I think it has bounded tools, a dedicated harness run by the vendor, which you can't access. Claude Code, Antigravity, Codex: agentic harnesses, with tools, M.C.P. servers and skills. The model can be the same from one row to the next. It's the harness that changes.

## harness-config

Every harness is software, and you have to learn it, like any new engineering tool. In an agentic harness, you set four things. The model, more or less expensive, more or less smart. The mode, which is permission handling: how often it asks before acting. The rules file, read at the start of every conversation, global or per project. The M.C.P. servers, declared in a configuration file. And skills. The upside is that the model has its harness's documentation in its system instructions. It knows its limits, and even has an idea of what the interface looks like. Don't hesitate to ask it directly. For example: what's in your context?

## start

To get started. A rules file in your project folder, with what you want it to know in every conversation: the language, the M.C.P. servers to use, your conventions. Watch where you start the agent from: it doesn't read the same things depending on the folder. Then check what it read: what's in your context? And finally, a repetitive task: do it once with the agent, correct it, and ask it to turn it into a skill, with a script for the fixed part.

## discussion

And on your side? What access does the agent have today? Where does the harness run? What does I.T. allow, and what does it lock down? And which repetitive task would make a good first skill?

## resources

I've listed resources I like, if you want to go further on your own. One of them codes an agent from A to Z, cleanly: it's this talk, longer and better made. Everything you've seen here, I learned over four years, as the technology moved, and it moves fast.

## glossary-1

And there's a glossary of every word I used, in English and French. I tried to take the mystery out of a lot of things. The agent itself can explain everything I just explained: this is only a starting point. Thank you.

## glossary-2

## glossary-3

## glossary-4
