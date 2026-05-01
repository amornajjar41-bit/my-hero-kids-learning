export type TechSlide =
  | { kind: "hook"; title: string; body: string; visual: string }
  | { kind: "story"; heading: string; body: string; visual: string }
  | { kind: "fact"; label: string; fact: string; visual: string }
  | { kind: "quiz"; question: string; options: string[]; correctIndex: number; explanation: string }
  | { kind: "celebrate"; message: string };

export type TechLesson = {
  id: string;
  title: string;
  tagline: string;
  emoji: string;
  ageMin: number;
  colors: [string, string];
  slides: TechSlide[];
};

export const techLessons: TechLesson[] = [
  // ─── LESSON 1 ────────────────────────────────────────────────────────────────
  {
    id: "tech-1",
    title: "Meet Computers!",
    tagline: "The magic machine that does it all",
    emoji: "🖥️",
    ageMin: 5,
    colors: ["#0EA5E9", "#0369A1"],
    slides: [
      {
        kind: "hook",
        title: "Welcome to the World of Computers! 🖥️",
        body: "Ready to discover the most amazing machine ever invented? Computers are everywhere — and today you'll learn exactly how they work! Let's go! 🚀",
        visual: "🖥️✨",
      },
      {
        kind: "story",
        heading: "What Is a Computer?",
        body: "A computer is a super-smart machine that follows your instructions! 🧠 It can play music, show movies, help you draw, and even talk to you. Computers do exactly what you tell them — not one bit more, not one bit less!",
        visual: "🖥️💡",
      },
      {
        kind: "story",
        heading: "The Four Super Parts",
        body: "Every computer has four key parts! The SCREEN shows you everything. The KEYBOARD lets you type. The MOUSE lets you click. And the BRAIN inside — called the processor — does all the thinking at lightning speed! ⚡",
        visual: "⌨️🖱️🧠",
      },
      {
        kind: "story",
        heading: "Computers Are Everywhere!",
        body: "Guess what? Computers are hiding EVERYWHERE! 🤯 Your TV has one inside. Your tablet IS one. Traffic lights, ATMs, even some refrigerators have tiny computers! Once you know this, you'll see them all around you.",
        visual: "📺📱🚦",
      },
      {
        kind: "story",
        heading: "Computers Only Understand Two Things",
        body: "Here's a wild secret — computers only understand TWO numbers: 0 and 1. That's it! 🔢 Zero means OFF, and One means ON — like a light switch. Everything you see, hear, or do on a computer is made of millions of these tiny on-and-off signals!",
        visual: "0️⃣1️⃣💡",
      },
      {
        kind: "fact",
        label: "Mind-Blowing Fact!",
        fact: "The very first computer was so BIG it filled an entire room — as large as a house! 🏠 It weighed 30 tonnes. Today, your smartphone is a MILLION times more powerful than those giant machines!",
        visual: "🏠➡️📱",
      },
      {
        kind: "quiz",
        question: "What is a computer?",
        options: ["A magic spell book 📖", "A smart machine that follows instructions 🖥️", "A type of food 🍕", "A flying vehicle ✈️"],
        correctIndex: 1,
        explanation: "A computer is a smart machine that follows instructions! It processes information and can do many tasks.",
      },
      {
        kind: "quiz",
        question: "What are the TWO things a computer understands?",
        options: ["Yes and No", "Hot and Cold", "0 and 1 🔢", "Big and Small"],
        correctIndex: 2,
        explanation: "Computers only understand 0 (OFF) and 1 (ON)! Everything — music, videos, games — is made of billions of these tiny signals!",
      },
      {
        kind: "quiz",
        question: "Which of these also has a computer inside?",
        options: ["🌳 A tree", "🚦 Traffic lights", "🌊 The ocean", "🌈 A rainbow"],
        correctIndex: 1,
        explanation: "Traffic lights have tiny computers that control when to switch between red, yellow, and green!",
      },
      {
        kind: "celebrate",
        message: "Amazing! You're officially a Computer Explorer! 🖥️🏆 You know what computers are, how they work, and where they hide!",
      },
    ],
  },

  // ─── LESSON 2 ────────────────────────────────────────────────────────────────
  {
    id: "tech-2",
    title: "Robots Are Helpers!",
    tagline: "Meet your super helpful robot friends",
    emoji: "🤖",
    ageMin: 5,
    colors: ["#10B981", "#065F46"],
    slides: [
      {
        kind: "hook",
        title: "Robots: The Coolest Helpers Ever! 🤖",
        body: "Robots can vacuum your floor, explore other planets, and even perform surgery! Today we'll discover what robots really are and how they help people every single day. Let's meet them! 🌟",
        visual: "🤖✨",
      },
      {
        kind: "story",
        heading: "What Makes a Robot a Robot?",
        body: "A robot is a machine that can SENSE the world around it, THINK about what to do, and then ACT! 🎯 It uses sensors (like eyes), a computer brain, and motors (like muscles) to move and do tasks. Real robots are way cooler than cartoons!",
        visual: "👁️🧠💪",
      },
      {
        kind: "story",
        heading: "Robots at Home",
        body: "Have you seen a robot vacuum cleaner? 🧹 It drives around your floor, senses walls and furniture, and cleans without anyone telling it where to go! Some people even have robots that mow the lawn or deliver packages to their door! 📦",
        visual: "🧹🏠📦",
      },
      {
        kind: "story",
        heading: "Robots in Space!",
        body: "NASA sent a robot called Curiosity to Mars — a planet 225 million kilometers away! 🚀 Curiosity drives around Mars, takes photos, and studies rocks. No human could survive there yet, so robots go first as our brave explorers! 🔴",
        visual: "🚀🔴🤖",
      },
      {
        kind: "story",
        heading: "Robots Help Doctors",
        body: "Some robots help surgeons perform operations! 🏥 The robot's tiny arms can make cuts smaller than a human hand ever could. This means patients heal faster and feel less pain. Robots save lives every single day!",
        visual: "🏥🦾❤️",
      },
      {
        kind: "story",
        heading: "Who Tells Robots What to Do?",
        body: "Robots don't think on their own — humans program them! 👨‍💻 A programmer writes special instructions called code that tells the robot every move to make. Without a human's program, a robot just sits there doing nothing!",
        visual: "👨‍💻📝🤖",
      },
      {
        kind: "fact",
        label: "Amazing Robot Fact!",
        fact: "The fastest robot in the world can run at 45 kilometers per hour — almost as fast as a cheetah! 🐆 And the deepest-diving robot has explored 11 kilometers beneath the ocean surface where no human can survive!",
        visual: "🐆🌊🤖",
      },
      {
        kind: "quiz",
        question: "What three things does a robot do?",
        options: ["Eat, Sleep, Play 😴", "Sense, Think, Act 🤖", "Sing, Dance, Fly 🎵", "Jump, Run, Swim 🏊"],
        correctIndex: 1,
        explanation: "Every robot Senses its environment, Thinks using its computer brain, then Acts by moving or doing something!",
      },
      {
        kind: "quiz",
        question: "Which robot explored the planet Mars?",
        options: ["R2-D2 🎬", "Curiosity 🔴", "WALL-E 🎬", "Optimus Prime 🎬"],
        correctIndex: 1,
        explanation: "NASA's Curiosity rover is a real robot on Mars right now, studying rocks and taking photos of the red planet!",
      },
      {
        kind: "quiz",
        question: "Who tells a robot what to do?",
        options: ["Other robots 🤖", "Humans who write code 👨‍💻", "The robot decides itself 🤔", "The weather ☁️"],
        correctIndex: 1,
        explanation: "Humans write programs — sets of instructions called code — that tell the robot exactly what to do!",
      },
      {
        kind: "celebrate",
        message: "Incredible work! You now know all about robots! 🤖🏆 From space explorers to surgery helpers — robots are changing the world!",
      },
    ],
  },

  // ─── LESSON 3 ────────────────────────────────────────────────────────────────
  {
    id: "tech-3",
    title: "The Amazing Internet",
    tagline: "How the whole world connects",
    emoji: "🌐",
    ageMin: 6,
    colors: ["#8B5CF6", "#6D28D9"],
    slides: [
      {
        kind: "hook",
        title: "The Internet: A Web Connecting Everyone! 🌐",
        body: "Imagine being able to talk to someone in Japan, watch a video from Brazil, and learn from a teacher in Canada — all in one second! That's what the internet does. Let's discover how this magical network really works! 🔮",
        visual: "🌐✨",
      },
      {
        kind: "story",
        heading: "What Is the Internet?",
        body: "The internet is a GIGANTIC network of computers all connected together around the world! 🌍 Think of it like a massive spider web — millions of threads connecting billions of computers, phones, and tablets. When you send a message, it zips across this web in milliseconds!",
        visual: "🕷️🌍💻",
      },
      {
        kind: "story",
        heading: "How Does Your Message Travel?",
        body: "When you send a message, it gets chopped into tiny pieces called DATA PACKETS. 📦 Each packet travels through cables, satellites, and routers — sometimes going halfway around the world — then they reassemble at your friend's screen. All this happens in less than a second!",
        visual: "📦🛣️📱",
      },
      {
        kind: "story",
        heading: "Cables Under the Ocean!",
        body: "Here's something wild — most of the internet travels through cables on the OCEAN FLOOR! 🌊 These cables are about as thick as your arm and stretch for thousands of kilometers under the sea. They carry billions of messages every second between continents!",
        visual: "🌊🔌🌍",
      },
      {
        kind: "story",
        heading: "What Is WiFi?",
        body: "WiFi is radio waves that carry internet data through the air — just like how a radio station broadcasts music! 📻 Your router at home sends out these invisible waves, and your phone or tablet catches them. You're literally swimming in invisible internet waves right now! 🏄",
        visual: "📡📱🌊",
      },
      {
        kind: "story",
        heading: "Staying Safe Online",
        body: "The internet is amazing but you need to stay safe! 🛡️ Never share your real name, address, or school with strangers online. Use strong passwords — mix letters, numbers, and symbols. And always tell a trusted adult if something online makes you feel uncomfortable. Your safety comes first!",
        visual: "🛡️🔐👨‍👩‍👧",
      },
      {
        kind: "fact",
        label: "Incredible Internet Fact!",
        fact: "Every single minute on the internet: people send 200 MILLION emails, watch 500 hours of YouTube videos, and make 5 million Google searches! The internet never sleeps and never slows down — it runs 24 hours a day, 7 days a week! ⚡",
        visual: "📧📹🔍",
      },
      {
        kind: "quiz",
        question: "What does the internet connect?",
        options: ["Just phones 📱", "Computers all over the world 🌍", "Only schools 🏫", "Just your house 🏠"],
        correctIndex: 1,
        explanation: "The internet is a global network connecting billions of computers, phones, and devices all around the world!",
      },
      {
        kind: "quiz",
        question: "What are data packets?",
        options: ["Snack packages 🍫", "Tiny pieces your message is split into 📦", "A type of robot 🤖", "Email folders 📂"],
        correctIndex: 1,
        explanation: "Your messages and videos are broken into tiny data packets that travel separately and reassemble at the destination!",
      },
      {
        kind: "quiz",
        question: "How does WiFi work?",
        options: ["Magic spells ✨", "Radio waves through the air 📡", "Underground tunnels 🕳️", "Smoke signals 💨"],
        correctIndex: 1,
        explanation: "WiFi uses radio waves — invisible signals in the air — to carry internet data to your devices wirelessly!",
      },
      {
        kind: "celebrate",
        message: "You're an Internet Explorer! 🌐🏆 You now understand how the world's biggest network connects everyone on Earth!",
      },
    ],
  },

  // ─── LESSON 4 ────────────────────────────────────────────────────────────────
  {
    id: "tech-4",
    title: "How AI Thinks",
    tagline: "The brain that learns from experience",
    emoji: "🧠",
    ageMin: 7,
    colors: ["#F59E0B", "#D97706"],
    slides: [
      {
        kind: "hook",
        title: "Artificial Intelligence: The Learning Brain! 🧠",
        body: "What if a computer could LEARN — just like you do? That's exactly what Artificial Intelligence, or AI, is! It's not magic — it's clever math and millions of examples. Ready to understand how AI actually thinks? Let's go, champ! 🚀",
        visual: "🧠💡✨",
      },
      {
        kind: "story",
        heading: "What Is Artificial Intelligence?",
        body: "Artificial Intelligence — AI for short — is when computers learn to do tasks that normally need human intelligence! 🤖 Like understanding what you say, recognizing your face, or translating languages. AI isn't one program — it's a whole field of amazing techniques!",
        visual: "🤖🧠💡",
      },
      {
        kind: "story",
        heading: "How AI Learns: The Training Process",
        body: "Imagine you want to teach a computer to recognize cats. You show it ONE MILLION photos labeled 'cat' and 'not cat.' 🐱 The AI finds patterns — pointy ears, whiskers, fur — and builds rules. After enough examples, it can recognize ANY cat it's never seen before!",
        visual: "🐱📸📊",
      },
      {
        kind: "story",
        heading: "AI Is Like a Student",
        body: "Think of AI as a student who never gets tired! 📚 You (the programmer) are the teacher. You give the AI thousands of examples, it makes mistakes, you correct it, it gets better. After millions of corrections, it becomes really, really good — sometimes even better than humans!",
        visual: "👨‍🏫📚🤖",
      },
      {
        kind: "story",
        heading: "AI Needs Tons of Data",
        body: "AI is hungry for DATA — information! 🍽️ The more data it has, the smarter it becomes. YouTube's AI watched billions of videos to learn what you like. Spotify's AI listened to millions of songs to know your taste. Data is food for AI!",
        visual: "📊📱🎵",
      },
      {
        kind: "story",
        heading: "What AI Can and Can't Do",
        body: "AI is amazing at finding patterns in huge amounts of data — it can read X-rays, translate 100 languages, and beat chess champions! ♟️ But AI can't feel emotions, be truly creative, or understand life like humans do. AI is a tool — a very powerful one — built by people!",
        visual: "♟️❤️🎨",
      },
      {
        kind: "fact",
        label: "Incredible AI Fact!",
        fact: "AlphaGo, an AI made by Google, became the world champion of Go — an ancient board game with more possible moves than atoms in the universe! 🎯 It learned by playing millions of games against itself over just a few days. Humans practice for decades!",
        visual: "♟️🌌🏆",
      },
      {
        kind: "quiz",
        question: "What does AI stand for?",
        options: ["Amazing Invention 🌟", "Artificial Intelligence 🧠", "Automatic Internet 🌐", "Animal Intelligence 🐘"],
        correctIndex: 1,
        explanation: "AI stands for Artificial Intelligence — computers programmed to do tasks that normally require human thinking!",
      },
      {
        kind: "quiz",
        question: "How does AI learn to recognize cats?",
        options: ["By watching cat cartoons 🐱", "By seeing millions of labeled photos 📸", "By talking to real cats 😸", "By reading a cat book 📚"],
        correctIndex: 1,
        explanation: "AI learns by seeing millions of examples with labels! It finds patterns in those examples and builds rules for recognizing new ones.",
      },
      {
        kind: "quiz",
        question: "What does AI need A LOT of to get smarter?",
        options: ["Electricity ⚡", "Data 📊", "Sleep 💤", "Water 💧"],
        correctIndex: 1,
        explanation: "AI needs massive amounts of data — examples, photos, sounds, text — to learn patterns and improve!",
      },
      {
        kind: "celebrate",
        message: "Brilliant! You understand how AI thinks! 🧠🏆 You now know more about AI than most adults! Keep exploring!",
      },
    ],
  },

  // ─── LESSON 5 ────────────────────────────────────────────────────────────────
  {
    id: "tech-5",
    title: "Coding: Talk to Computers",
    tagline: "Write instructions that machines understand",
    emoji: "💻",
    ageMin: 7,
    colors: ["#EC4899", "#BE185D"],
    slides: [
      {
        kind: "hook",
        title: "Coding: Giving Instructions to Computers! 💻",
        body: "What if you could tell a computer EXACTLY what to do — and it would obey perfectly? That's coding! It's one of the most powerful skills in the world, and YOU can learn it. Let's discover what coding really is! 🌟",
        visual: "💻✨🚀",
      },
      {
        kind: "story",
        heading: "What Is Coding?",
        body: "Coding — also called programming — is writing instructions in a language a computer understands. 📝 Just like you follow a recipe to bake cookies, a computer follows code to do tasks. The difference? Computers do EXACTLY what you write — no guessing, no shortcuts!",
        visual: "📝🍪💻",
      },
      {
        kind: "story",
        heading: "Algorithms: The Recipe of Code",
        body: "An algorithm is a step-by-step plan for solving a problem — like a recipe! 🍳 'Wake up → Get dressed → Eat breakfast → Go to school' — that's an algorithm for your morning! Coders write algorithms and translate them into code. Good algorithms = great programs!",
        visual: "🍳📋✅",
      },
      {
        kind: "story",
        heading: "Computers Are Very Literal!",
        body: "Here's a funny thing about computers — they do EXACTLY what you say, not what you MEAN! 🤣 If you write 'make sandwich' without explaining HOW, the computer is lost. Coders must be super precise. 'Get bread, spread butter on one side, add cheese, place second slice on top' — NOW it works!",
        visual: "🥪🤖😂",
      },
      {
        kind: "story",
        heading: "Programming Languages",
        body: "Computers understand special languages called programming languages! 🗣️ Python is great for beginners and AI. JavaScript makes websites interactive. Scratch uses colorful blocks to teach kids. There are hundreds of languages — each best for different jobs. Coders pick the right tool!",
        visual: "🐍🌐🎨",
      },
      {
        kind: "story",
        heading: "Everyone Can Code!",
        body: "You don't need to be a math genius to code! 💡 You need LOGIC — the ability to think step by step — and CREATIVITY. Girls, boys, young and old all code! The youngest programmer in the world was just 6 years old! Age is no barrier to coding greatness! 🌟",
        visual: "👧👦💻🌍",
      },
      {
        kind: "fact",
        label: "Coding Superpower Fact!",
        fact: "Every app you've ever used — YouTube, Minecraft, WhatsApp — was built by programmers writing code! 🎮 Minecraft was originally built by just ONE programmer in his spare time. Today it's played by 140 million people monthly. One person + code = changing the world!",
        visual: "🎮🌍💻",
      },
      {
        kind: "quiz",
        question: "What is coding?",
        options: ["Painting pictures 🎨", "Writing instructions for computers 💻", "A type of secret language 🔐", "Building with blocks 🧱"],
        correctIndex: 1,
        explanation: "Coding is writing step-by-step instructions in a language computers understand, so they can complete tasks!",
      },
      {
        kind: "quiz",
        question: "What is an algorithm?",
        options: ["A type of robot 🤖", "A step-by-step plan for solving a problem 📋", "A computer virus 🦠", "An internet cable 🔌"],
        correctIndex: 1,
        explanation: "An algorithm is a clear, step-by-step plan for solving a problem — like a recipe that computers follow!",
      },
      {
        kind: "quiz",
        question: "Which language is good for beginners and AI?",
        options: ["Spanish 🇪🇸", "Python 🐍", "Morse Code 📡", "Sign Language 🤟"],
        correctIndex: 1,
        explanation: "Python is a popular programming language known for being beginner-friendly and widely used in AI and data science!",
      },
      {
        kind: "celebrate",
        message: "You're a Coding Superstar! 💻🏆 You understand what coding is, how algorithms work, and you know this skill can change the world!",
      },
    ],
  },

  // ─── LESSON 6 ────────────────────────────────────────────────────────────────
  {
    id: "tech-6",
    title: "Loops & Patterns",
    tagline: "The superpower of repeating steps",
    emoji: "🔄",
    ageMin: 8,
    colors: ["#06B6D4", "#0E7490"],
    slides: [
      {
        kind: "hook",
        title: "Loops: Coding's Greatest Superpower! 🔄",
        body: "What if you had to write 'draw a circle' 1000 times to make a spiral? That would take forever! Programmers use LOOPS to repeat steps automatically. It's one of the most powerful ideas in all of computing. Let's master it! ⚡",
        visual: "🔄💻⚡",
      },
      {
        kind: "story",
        heading: "What Is a Loop?",
        body: "A loop tells the computer: 'Repeat this action X times' or 'Keep repeating until this condition is true.' 🔁 Think of your morning routine — you brush EVERY tooth one by one. That's a loop! 'For each tooth: brush for 2 seconds. Repeat until all done.'",
        visual: "🔁🦷⏰",
      },
      {
        kind: "story",
        heading: "The For Loop",
        body: "A FOR loop repeats an action a specific number of times! 🔢 Example: 'For 10 times: print a star.' The computer prints ✦✦✦✦✦✦✦✦✦✦ — ten stars instantly! Without a loop, you'd write 'print star' ten separate times. Loops save enormous amounts of work!",
        visual: "🔢✦✦✦",
      },
      {
        kind: "story",
        heading: "The While Loop",
        body: "A WHILE loop keeps running AS LONG AS something is true! ⏳ Like: 'While there are dirty dishes: wash one dish.' The loop keeps going until all dishes are clean — then stops. Computers use while loops for things like: 'While game is running: check for player input.'",
        visual: "⏳🍽️✅",
      },
      {
        kind: "story",
        heading: "Loops in Real Apps",
        body: "Every app you use is full of loops! 🎮 In a game, there's a GAME LOOP that runs 60 times per second: 'Check what the player pressed → Update character position → Draw the screen → Repeat!' YouTube's loop shows you video after video. Social media loops through your feed. Loops are EVERYWHERE!",
        visual: "🎮🔄📱",
      },
      {
        kind: "fact",
        label: "Loop Power Fact!",
        fact: "Scientists used a computer loop to calculate Pi to 100 TRILLION decimal places! 🔢 Pi is 3.14159... and goes on forever. The loop ran for 157 days non-stop, computing digits faster than any human ever could. That's the power of loops — infinite patience!",
        visual: "🔢🌀🏆",
      },
      {
        kind: "quiz",
        question: "What does a loop do in coding?",
        options: ["Deletes data 🗑️", "Repeats an action automatically 🔄", "Connects to the internet 🌐", "Draws pictures 🎨"],
        correctIndex: 1,
        explanation: "A loop tells the computer to repeat a set of instructions automatically — saving you from writing the same code hundreds of times!",
      },
      {
        kind: "quiz",
        question: "What type of loop repeats exactly 10 times?",
        options: ["A While loop ⏳", "A Forever loop ∞", "A For loop 🔢", "A Maybe loop 🤔"],
        correctIndex: 2,
        explanation: "A FOR loop repeats a specific number of times! You tell it exactly how many: 'for 10 times, do this action.'",
      },
      {
        kind: "quiz",
        question: "A game loop in a video game runs about how many times per second?",
        options: ["1 time 🐌", "10 times", "60 times ⚡", "1000 times 🤯"],
        correctIndex: 2,
        explanation: "Most video games run their main loop 60 times per second! Each loop checks input, updates positions, and redraws the screen.",
      },
      {
        kind: "celebrate",
        message: "Loop Master unlocked! 🔄🏆 You understand one of coding's most powerful ideas. Loops are the heartbeat of every program!",
      },
    ],
  },

  // ─── LESSON 7 ────────────────────────────────────────────────────────────────
  {
    id: "tech-7",
    title: "If-Then Decisions",
    tagline: "How computers make smart choices",
    emoji: "🤔",
    ageMin: 8,
    colors: ["#F97316", "#C2410C"],
    slides: [
      {
        kind: "hook",
        title: "If-Then: How Computers Make Decisions! 🤔",
        body: "Every single decision a computer makes — every button click, every game choice, every filter on a photo — is made using IF-THEN logic! This simple idea is behind EVERYTHING in computing. Ready to think like a computer? Let's go! 💡",
        visual: "🤔💡✅",
      },
      {
        kind: "story",
        heading: "What Is an If-Then Statement?",
        body: "An if-then statement tells a computer: IF this is true, THEN do that. 🎯 Example: IF it's raining, THEN take an umbrella. IF you scored over 90, THEN say 'Great job!' You use if-then thinking every day — computers just do it millions of times per second!",
        visual: "☔➡️🌂",
      },
      {
        kind: "story",
        heading: "Adding the Else",
        body: "We can add an ELSE to handle the other case! 🔀 IF it is raining: take umbrella. ELSE: leave umbrella at home. In code, this covers ALL possibilities — if the condition isn't true, the else handles it. This way your program never gets confused or stuck!",
        visual: "☔✅🌞",
      },
      {
        kind: "story",
        heading: "If-Then in Games",
        body: "Video games are FULL of if-then logic! 🎮 IF player touches enemy → lose a life. IF score reaches 100 → level up. IF player presses jump button → make character jump. Without if-then statements, games couldn't react to anything you do! Every single game mechanic is built this way!",
        visual: "🎮❓➡️🎯",
      },
      {
        kind: "story",
        heading: "Conditions Can Be Complex",
        body: "Conditions can combine! 🔗 Using AND: IF it's raining AND you're outside → use umbrella. Using OR: IF hungry OR thirsty → go to kitchen. Using NOT: IF NOT tired → keep playing. Real programs combine dozens of conditions to make sophisticated decisions!",
        visual: "🔗🧩💡",
      },
      {
        kind: "fact",
        label: "Smart Decision Fact!",
        fact: "The autopilot system in a modern airplane makes over 10,000 if-then decisions per second! ✈️ IF altitude drops → adjust engines. IF storm detected → reroute. IF fuel low → warn pilot. This incredible decision-making keeps millions of passengers safe every day!",
        visual: "✈️⚡🛡️",
      },
      {
        kind: "quiz",
        question: "What does an if-then statement do?",
        options: ["Loops through data 🔄", "Makes a decision based on a condition ✅", "Connects to the internet 🌐", "Draws graphics 🎨"],
        correctIndex: 1,
        explanation: "If-then statements let computers make decisions! IF a condition is true, THEN do something specific.",
      },
      {
        kind: "quiz",
        question: "What does ELSE do in an if-then statement?",
        options: ["Stops the program 🛑", "Handles what happens when the IF is FALSE 🔀", "Repeats the code 🔄", "Sends an email 📧"],
        correctIndex: 1,
        explanation: "ELSE handles the case when the IF condition is false! Together, IF-ELSE covers all possible situations.",
      },
      {
        kind: "quiz",
        question: "IF score >= 100 THEN level up — what happens when score is 85?",
        options: ["Level up 🎉", "Nothing happens from this code ⏸️", "Game ends 🛑", "Score resets 🔢"],
        correctIndex: 1,
        explanation: "If score is 85, the condition (score >= 100) is false, so the level-up code doesn't run! The ELSE part would handle this case.",
      },
      {
        kind: "celebrate",
        message: "Decision Champion! 🤔🏆 You now think like a computer! If-then logic is the foundation of every app, game, and AI system in the world!",
      },
    ],
  },

  // ─── LESSON 8 ────────────────────────────────────────────────────────────────
  {
    id: "tech-8",
    title: "Your Amazing Smartphone",
    tagline: "A supercomputer that fits in your pocket",
    emoji: "📱",
    ageMin: 8,
    colors: ["#6366F1", "#4338CA"],
    slides: [
      {
        kind: "hook",
        title: "Your Smartphone: A Pocket Supercomputer! 📱",
        body: "Your smartphone is more powerful than the computers NASA used to send astronauts to the moon! 🚀 It has sensors, cameras, GPS, radio, and a brain doing billions of calculations per second. Let's crack it open and see what's really inside! 🔍",
        visual: "📱✨🚀",
      },
      {
        kind: "story",
        heading: "The Processor: Your Phone's Brain",
        body: "Inside your phone is a tiny chip called a processor — your phone's brain! 🧠 A modern phone processor has 15 BILLION transistors — microscopic switches — on a chip smaller than your thumbnail. It does billions of calculations every second without breaking a sweat!",
        visual: "🧠💫🔬",
      },
      {
        kind: "story",
        heading: "How Does a Touchscreen Work?",
        body: "Your touchscreen is covered in a grid of tiny electrodes that detect your finger's electrical charge! ⚡ Your body conducts electricity, so when your finger touches the glass, it disturbs the electric field at that exact spot. The phone calculates the X and Y position in milliseconds!",
        visual: "👆⚡🎯",
      },
      {
        kind: "story",
        heading: "The Camera: Better Than Your Eyes",
        body: "Your phone camera has millions of tiny sensors called pixels! 📸 Each pixel measures how much light hits it. A 12-megapixel camera captures 12 MILLION pixels per photo. AI then processes the photo — reducing noise, balancing color, and sharpening details — all in a fraction of a second!",
        visual: "📸🔬💡",
      },
      {
        kind: "story",
        heading: "GPS: Space Signals Find Your Location",
        body: "GPS works using signals from 24 satellites orbiting 20,000km above Earth! 🛰️ Your phone listens to at least 4 satellites. By calculating how long each signal took to arrive, your phone triangulates your exact position — accurate to within 3 meters. Space is helping you navigate! 🌍",
        visual: "🛰️🌍📍",
      },
      {
        kind: "story",
        heading: "All the Hidden Sensors",
        body: "Your phone secretly has LOTS of sensors you might not know about! 🕵️ Accelerometer (knows if it's tilting), gyroscope (detects rotation), barometer (measures air pressure for altitude), magnetometer (it's a compass!), ambient light sensor (dims your screen automatically), and proximity sensor (turns off screen during calls)!",
        visual: "🕵️🔮📡",
      },
      {
        kind: "fact",
        label: "Smartphone Superpower Fact!",
        fact: "The iPhone in your pocket is 100,000 times more powerful than the Apollo 11 computer that guided astronauts to the moon in 1969! 🌙 The Apollo computer had just 4KB of memory. Your phone has billions of times more. You carry history's most powerful computer everywhere! 🚀",
        visual: "🌙➡️📱🏆",
      },
      {
        kind: "quiz",
        question: "How does a touchscreen know where you touched?",
        options: ["Magic 🪄", "Your finger's electrical charge ⚡", "Sound waves 🔊", "Suction cups 🪣"],
        correctIndex: 1,
        explanation: "Touchscreens detect your finger's electrical charge! Our bodies conduct electricity, and the screen measures exactly where the charge changed.",
      },
      {
        kind: "quiz",
        question: "How many satellites does GPS need to find your location?",
        options: ["1 satellite 🛰️", "At least 4 satellites 🛰️🛰️🛰️🛰️", "100 satellites 🤯", "No satellites 🚫"],
        correctIndex: 1,
        explanation: "GPS needs signals from at least 4 satellites to accurately calculate your 3D position — latitude, longitude, and altitude!",
      },
      {
        kind: "quiz",
        question: "What does the accelerometer in your phone do?",
        options: ["Takes photos 📸", "Detects tilting and movement 📱", "Plays music 🎵", "Charges the battery 🔋"],
        correctIndex: 1,
        explanation: "The accelerometer detects how your phone is tilting and moving — it's why your screen rotates when you turn your phone sideways!",
      },
      {
        kind: "celebrate",
        message: "Tech Genius! 📱🏆 You now know more about your smartphone than most people ever will! That little rectangle in your pocket is truly miraculous!",
      },
    ],
  },

  // ─── LESSON 9 ────────────────────────────────────────────────────────────────
  {
    id: "tech-9",
    title: "AI in Your Life Every Day",
    tagline: "You already use AI a dozen times a day",
    emoji: "🌟",
    ageMin: 9,
    colors: ["#14B8A6", "#0F766E"],
    slides: [
      {
        kind: "hook",
        title: "AI Is Already Your Best Friend! 🌟",
        body: "You're already using Artificial Intelligence dozens of times every single day — and you probably didn't even know it! From the moment you wake up to when you go to sleep, AI is quietly working to make your life better. Let's count all the ways! 🔍",
        visual: "🌟🤖✨",
      },
      {
        kind: "story",
        heading: "Good Morning, AI!",
        body: "Your morning starts with AI! ☀️ Your phone's alarm was set by you but the face recognition that unlocks it? Pure AI! Your email app uses AI to sort spam. If you asked Siri or Google Assistant something, that's AI understanding your voice. Breakfast hasn't started and AI is already working! 🍳",
        visual: "☀️📱🗣️",
      },
      {
        kind: "story",
        heading: "Autocorrect and Smart Keyboard",
        body: "When your phone suggests the next word as you type — that's AI! 🔤 It has learned from billions of text messages and knows what words typically follow others. Autocorrect fixes typos by predicting what you MEANT to write. This AI model was trained on more text than any human could ever read!",
        visual: "🔤💡📱",
      },
      {
        kind: "story",
        heading: "YouTube and Spotify Know You!",
        body: "Ever wonder why YouTube always knows what video you'd love next? 🎬 AI tracks every video you watch, how long, if you skipped, if you liked it — and builds a model of your taste. Spotify does the same with music. These recommendation AIs are studied by thousands of engineers to get it just right!",
        visual: "🎬🎵🧠",
      },
      {
        kind: "story",
        heading: "Face Recognition Everywhere",
        body: "AI can identify your face in a crowd of millions in under a second! 👤 It maps 68 key points on your face — the distance between your eyes, the shape of your jawline — and creates a mathematical fingerprint unique to you. Your phone, social media tags, and airport security all use this!",
        visual: "👤🔍📐",
      },
      {
        kind: "story",
        heading: "AI Keeps You Safe Online",
        body: "AI works like a guardian angel online! 🛡️ It detects spam emails, blocks fake news, catches suspicious bank transactions, and filters harmful content from your social media. Every day, AI blocks billions of cyber attacks before they can reach you. You're protected by invisible AI shields!",
        visual: "🛡️🦠💻",
      },
      {
        kind: "fact",
        label: "Your AI Personal Assistant Fact!",
        fact: "Google's AI translates over 100 BILLION words every single day across 109 languages — more than all human translators in history combined! 🌍 This real-time translation is breaking down language barriers worldwide. When you travel and translate a sign, you're using the most powerful translation system ever built!",
        visual: "🌍🗣️✨",
      },
      {
        kind: "quiz",
        question: "How does YouTube decide what video to show you next?",
        options: ["Random chance 🎲", "AI that learned your preferences 🧠", "Your friends choose 👫", "The newest videos first ⏰"],
        correctIndex: 1,
        explanation: "YouTube's recommendation AI analyzes your watch history, likes, skips, and even how long you watched each video to suggest what you'd love next!",
      },
      {
        kind: "quiz",
        question: "What does face recognition AI map on your face?",
        options: ["Your hairstyle 💇", "Key measurement points like eye distance 📐", "The color of your eyes 👁️", "Your smile width 😁"],
        correctIndex: 1,
        explanation: "Face recognition AI maps specific key points — distances and angles between features — to create a unique mathematical fingerprint of your face!",
      },
      {
        kind: "quiz",
        question: "AI guards you online by doing what?",
        options: ["Nothing at all 🚫", "Blocking spam, fraud, and cyber attacks 🛡️", "Sending you ads 📢", "Slowing down your internet 🐌"],
        correctIndex: 1,
        explanation: "AI acts as a digital guardian, detecting spam emails, fraudulent transactions, and blocking billions of cyber attacks every day!",
      },
      {
        kind: "celebrate",
        message: "AI Detective! 🌟🏆 You can now spot AI everywhere you look! You're living in the most technologically amazing time in human history!",
      },
    ],
  },

  // ─── LESSON 10 ────────────────────────────────────────────────────────────────
  {
    id: "tech-10",
    title: "Machine Learning Magic",
    tagline: "How AI gets smarter without being programmed",
    emoji: "📊",
    ageMin: 10,
    colors: ["#7C3AED", "#5B21B6"],
    slides: [
      {
        kind: "hook",
        title: "Machine Learning: AI That Teaches Itself! 📊",
        body: "What if a computer could learn without anyone writing rules for it? That's Machine Learning — the most revolutionary idea in modern technology! Instead of programmers writing every rule, the AI figures out the rules from data. This changes EVERYTHING. Let's dive deep! 🌊",
        visual: "📊🧠✨",
      },
      {
        kind: "story",
        heading: "Traditional Programming vs. Machine Learning",
        body: "Old way: programmers write all the rules. 👨‍💻 'IF email contains these 200 spam words → mark as spam.' Problem: spammers just change the words! Machine Learning way: show the AI 10 million real and spam emails and let IT figure out the patterns. Result: it catches spam no human ever thought to block!",
        visual: "👨‍💻➡️🤖📊",
      },
      {
        kind: "story",
        heading: "Training, Validation, Testing",
        body: "Training an AI has three stages! 🎓 First, TRAINING: feed the AI tons of labeled examples so it builds its model. Second, VALIDATION: test it on new examples to tune it. Third, TESTING: give it completely unseen data — its final exam! Only then do you know if it truly learned.",
        visual: "🎓📝✅",
      },
      {
        kind: "story",
        heading: "Neural Networks: Inspired by the Brain",
        body: "The most powerful machine learning uses NEURAL NETWORKS — systems loosely inspired by how your brain works! 🧠 Your brain has 86 billion neurons connected together. A neural network is artificial neurons connected in layers. Information flows through the layers, and the network adjusts its connections to get better at tasks!",
        visual: "🧠🔗💡",
      },
      {
        kind: "story",
        heading: "Deep Learning: Layers Upon Layers",
        body: "DEEP LEARNING adds many layers to neural networks — some have hundreds of layers! 🏗️ The first layer might detect edges in images. The next detects shapes. The next recognizes objects. The final layer says 'that's a cat!' Each layer builds on the previous one to understand complex patterns. This is what makes ChatGPT and image AI possible!",
        visual: "🏗️👁️🐱",
      },
      {
        kind: "story",
        heading: "Overfitting: Learning Too Hard",
        body: "Here's a sneaky problem called OVERFITTING! 🎯 If an AI memorizes its training data TOO perfectly, it fails on new data — like a student who memorizes the exact test questions instead of understanding the subject. Scientists use clever tricks to prevent this and make AI that truly generalizes!",
        visual: "📚⚠️🎯",
      },
      {
        kind: "fact",
        label: "Machine Learning Scale Fact!",
        fact: "GPT-4, the AI behind ChatGPT, was trained on approximately 1 TRILLION words of text — more words than all humans combined have written in the past 20 years! 📚 It took thousands of computer chips running for months to train. The final model has hundreds of BILLIONS of learned parameters!",
        visual: "📚🌍⚡",
      },
      {
        kind: "quiz",
        question: "What makes Machine Learning different from traditional programming?",
        options: ["It runs faster ⚡", "The AI learns patterns from data instead of following hand-written rules 📊", "It uses more electricity 🔌", "It needs more memory 💾"],
        correctIndex: 1,
        explanation: "In Machine Learning, instead of programmers writing every rule, the AI figures out its own rules by analyzing large amounts of labeled data!",
      },
      {
        kind: "quiz",
        question: "What are Neural Networks inspired by?",
        options: ["Snake brains 🐍", "The human brain's neurons 🧠", "Internet cables 🔌", "The solar system 🪐"],
        correctIndex: 1,
        explanation: "Neural networks are loosely inspired by how biological neurons in the brain connect and communicate — though they work very differently!",
      },
      {
        kind: "quiz",
        question: "What is 'overfitting' in machine learning?",
        options: ["Wearing too many layers 🧥", "AI memorizing training data but failing on new data 📚", "Training too slowly 🐌", "Using too much electricity ⚡"],
        correctIndex: 1,
        explanation: "Overfitting is when an AI memorizes training examples so specifically that it fails to handle new, unseen examples — it learned facts, not concepts!",
      },
      {
        kind: "celebrate",
        message: "Machine Learning Master! 📊🏆 You understand the technology powering the AI revolution! This knowledge puts you ahead of 99% of people on Earth!",
      },
    ],
  },

  // ─── LESSON 11 ────────────────────────────────────────────────────────────────
  {
    id: "tech-11",
    title: "How Search Engines Work",
    tagline: "Finding needles in the internet haystack",
    emoji: "🔍",
    ageMin: 10,
    colors: ["#F59E0B", "#B45309"],
    slides: [
      {
        kind: "hook",
        title: "Google: Finding Anything in 0.1 Seconds! 🔍",
        body: "When you search for something on Google, it searches through over 100 BILLION web pages and gives you an answer in a fraction of a second. How? Magic? Engineering genius? Let's discover the incredible science behind search engines! 🌐",
        visual: "🔍🌐⚡",
      },
      {
        kind: "story",
        heading: "Step 1: Crawling the Web",
        body: "Google sends out billions of programs called CRAWLERS (or spiders) that surf the entire internet! 🕷️ They visit every website, read all the text, follow every link to new pages, then come back and report what they found. This never stops — the web is always changing, and crawlers keep up 24/7!",
        visual: "🕷️🌐📖",
      },
      {
        kind: "story",
        heading: "Step 2: Indexing — Building the Library",
        body: "After crawling, Google INDEXES the information — like organizing a massive library! 📚 It notes which words appear on which pages, how many times, how prominently. This creates a giant lookup table: 'the word DINOSAUR appears on these 4.2 billion pages.' This index is stored on millions of servers worldwide!",
        visual: "📚🗂️🌍",
      },
      {
        kind: "story",
        heading: "Step 3: Ranking — Who Goes First?",
        body: "When you search, Google must decide which of millions of matching pages to show FIRST! 📊 It uses over 200 signals: Is the page trusted? Does it have lots of links pointing to it? Is it fast? Is the content fresh? Does it actually answer your question? AI then reranks results based on your specific search!",
        visual: "📊🏆🎯",
      },
      {
        kind: "story",
        heading: "PageRank: The Brilliant Original Idea",
        body: "Google's founders had a genius insight: a web page is important if IMPORTANT pages link to it! 🔗 Like academic papers — a paper cited by Nobel Prize winners is probably more valuable than one cited by nobody. This 'PageRank' algorithm started Google and is still a core part of how search works today!",
        visual: "🏆🔗💡",
      },
      {
        kind: "story",
        heading: "AI Makes Search Smarter",
        body: "Modern Google uses AI to understand what you MEAN, not just what you typed! 🧠 If you search 'how tall is a giraffe compared to a school bus' — Google understands you want a comparison, not just two separate numbers. AI reads your intent and finds the perfect answer, even for questions never asked before!",
        visual: "🧠🔍🦒",
      },
      {
        kind: "fact",
        label: "Search Scale Fact!",
        fact: "Google processes over 8.5 BILLION searches every single day — that's 99,000 searches every second! 🚀 To store its index and serve results, Google operates over 1 million servers in data centers around the world. If Google goes down for even 5 minutes, global internet traffic drops by 40%!",
        visual: "🚀🌍💻",
      },
      {
        kind: "quiz",
        question: "What are web crawlers?",
        options: ["Bugs on computers 🐛", "Programs that surf the web reading pages 🕷️", "Slow internet connections 🐌", "Spam emails 📧"],
        correctIndex: 1,
        explanation: "Web crawlers (spiders) are automated programs that continuously browse the internet, reading pages and following links to discover new content!",
      },
      {
        kind: "quiz",
        question: "What is a search engine's INDEX?",
        options: ["A book table of contents 📖", "A massive lookup table linking words to web pages 🗂️", "A type of ranking system 📊", "A list of blocked websites 🚫"],
        correctIndex: 1,
        explanation: "The index is Google's giant database that maps every word it has found to all the web pages where that word appears — making searching instant!",
      },
      {
        kind: "quiz",
        question: "What was PageRank's brilliant original idea?",
        options: ["Newer pages rank higher 📅", "Pages linked from important pages are important 🔗", "Longer pages rank higher 📏", "Pages with more ads rank higher 💰"],
        correctIndex: 1,
        explanation: "PageRank was based on the idea that a page is important if other important pages link to it — like academic citations. Simple but genius!",
      },
      {
        kind: "celebrate",
        message: "Search Engine Expert! 🔍🏆 You now understand what happens in that fraction of a second between your search and your answer. Pure engineering brilliance!",
      },
    ],
  },

  // ─── LESSON 12 ────────────────────────────────────────────────────────────────
  {
    id: "tech-12",
    title: "Cybersecurity: Staying Safe",
    tagline: "Protecting yourself in the digital world",
    emoji: "🔐",
    ageMin: 10,
    colors: ["#EF4444", "#B91C1C"],
    slides: [
      {
        kind: "hook",
        title: "Cybersecurity: Your Digital Shield! 🔐",
        body: "Every year, cybercriminals steal over 3 TRILLION dollars from people and businesses online! 💸 But with the right knowledge, you can protect yourself completely. Cybersecurity is one of the most important skills of the 21st century. Let's master it! 🛡️",
        visual: "🔐🛡️⚔️",
      },
      {
        kind: "story",
        heading: "What Is Cybersecurity?",
        body: "Cybersecurity is the practice of protecting computers, networks, and data from hackers and cyberattacks! 🛡️ Just like a castle has walls, moats, and guards, digital systems need passwords, encryption, and firewalls. Cybersecurity experts are the guards of the digital world!",
        visual: "🏰🛡️💻",
      },
      {
        kind: "story",
        heading: "The Power of Strong Passwords",
        body: "A weak password can be cracked in seconds! ⏱️ 'password123' takes a hacker 0.001 seconds to guess. But 'Tr0ub4dour&3' would take 550 YEARS to crack! Great passwords mix uppercase, lowercase, numbers, and symbols — and are at least 12 characters long. Use a unique password for EVERY account!",
        visual: "🔑⏱️💪",
      },
      {
        kind: "story",
        heading: "Phishing: The Digital Trick",
        body: "Phishing is when hackers disguise themselves as trusted companies! 🎣 They send fake emails saying 'Your account is hacked — click here immediately!' The link goes to a fake website that steals your password. Rule: NEVER click links in panic-inducing emails. Always go to websites directly by typing the address!",
        visual: "🎣📧⚠️",
      },
      {
        kind: "story",
        heading: "Two-Factor Authentication",
        body: "Two-Factor Authentication (2FA) is a superpower! 🦸 Even if someone gets your password, they still can't log in — because they also need a code sent to YOUR phone. It's like your house having TWO locks: even if someone copies your key, they still can't enter without the second one. Always turn on 2FA!",
        visual: "🦸🔑📱",
      },
      {
        kind: "story",
        heading: "Encryption: Secret Messages",
        body: "Encryption scrambles your data so only the right person can read it! 🔒 When you use HTTPS (the padlock in your browser), your data is encrypted before leaving your device. Even if a hacker intercepts it, they just see random gibberish. Modern encryption would take a billion years to crack — even with a supercomputer! ⚡",
        visual: "🔒🔀💬",
      },
      {
        kind: "fact",
        label: "Hacker World Fact!",
        fact: "There are 2,200 cyberattacks every single day — that's one attack every 39 seconds! 🚨 The most expensive hack in history cost one company 10 BILLION dollars. Because of this, cybersecurity is the fastest-growing career in the world, with millions of jobs unfilled right now!",
        visual: "🚨💻🌍",
      },
      {
        kind: "quiz",
        question: "Which password is strongest?",
        options: ["password123 😴", "myname2009 📅", "Tr0ub4dour&3 💪", "abc123 🔤"],
        correctIndex: 2,
        explanation: "Tr0ub4dour&3 mixes uppercase, lowercase, numbers, and symbols — making it extremely hard to crack. The other passwords are very common and easily guessed!",
      },
      {
        kind: "quiz",
        question: "What is phishing?",
        options: ["A sport 🎣", "Hackers pretending to be trusted companies to steal your info 📧", "A computer virus 🦠", "Searching the internet 🔍"],
        correctIndex: 1,
        explanation: "Phishing attacks trick you by disguising fake websites or emails as legitimate ones to steal your passwords and personal information!",
      },
      {
        kind: "quiz",
        question: "What does Two-Factor Authentication (2FA) add?",
        options: ["A stronger password 🔑", "A second verification step like a phone code 📱", "A fingerprint scanner 👆", "An antivirus scan 🛡️"],
        correctIndex: 1,
        explanation: "2FA requires a second proof of identity — usually a code sent to your phone — so even if someone knows your password, they still can't access your account!",
      },
      {
        kind: "celebrate",
        message: "Cybersecurity Warrior! 🔐🏆 You now have the knowledge to protect yourself in the digital world. Strong passwords, 2FA, and skepticism are your superpowers!",
      },
    ],
  },

  // ─── LESSON 13 ────────────────────────────────────────────────────────────────
  {
    id: "tech-13",
    title: "How Apps Are Built",
    tagline: "From idea to millions of users",
    emoji: "🛠️",
    ageMin: 10,
    colors: ["#84CC16", "#4D7C0F"],
    slides: [
      {
        kind: "hook",
        title: "How Apps Go From Idea to Your Phone! 🛠️",
        body: "That game you love, the app you use every day — someone had to BUILD it from scratch! 📱 The journey from 'I have an idea' to 'millions of people are using this' is incredible. Let's walk through every step of how apps are really made! 🚀",
        visual: "💡➡️📱🌍",
      },
      {
        kind: "story",
        heading: "Step 1: The Idea and Research",
        body: "Every great app starts with a problem to solve! 💡 'Why is there no app that does X?' The team researches: Does this problem really exist? How many people have it? Have others tried to solve it? They interview potential users, study competition, and define EXACTLY what the app will do before writing a single line of code!",
        visual: "💡🔍📋",
      },
      {
        kind: "story",
        heading: "Step 2: Design — How It Looks and Feels",
        body: "UI/UX Designers create the app's look and feel! 🎨 They sketch wireframes (basic sketches of screens), then design beautiful interfaces. UX means User Experience — making the app intuitive so users never feel confused. The best apps feel so natural you never notice the thousands of design decisions behind them!",
        visual: "🎨✏️📱",
      },
      {
        kind: "story",
        heading: "Step 3: Development — Building It",
        body: "Developers write the code that makes the app work! 💻 Frontend developers build what you see and touch. Backend developers build the servers and databases. Sometimes there are 100+ developers working on different parts of one app! They use version control (like Git) so everyone's changes combine without chaos!",
        visual: "💻👥🔧",
      },
      {
        kind: "story",
        heading: "Step 4: Testing — Breaking It on Purpose!",
        body: "Testers (QA engineers) try EVERYTHING to make the app crash! 🔨 They test on different phones, with bad internet, with unusual inputs. 'What if I type 1 million characters in the name field? What if I press two buttons at the same time?' Finding and fixing bugs before launch saves the company from disaster!",
        visual: "🔨🐛✅",
      },
      {
        kind: "story",
        heading: "Step 5: Launch and Improve",
        body: "Launch day! 🚀 The app goes on the App Store or Google Play. But the work doesn't stop! The team watches how users behave: Where do they get confused? Which features do they love? Which do they ignore? Then they release UPDATES — improvements based on real user data. Great apps never stop evolving!",
        visual: "🚀📊🔄",
      },
      {
        kind: "fact",
        label: "App World Record Fact!",
        fact: "Instagram was built by just 13 people before being sold for 1 BILLION dollars to Facebook! 📸 WhatsApp had only 35 engineers when it was bought for 19 BILLION dollars. Small, brilliant teams with the right idea can change the world. You could be on that team someday! 🌟",
        visual: "👥💰🌍",
      },
      {
        kind: "quiz",
        question: "What do UX designers focus on?",
        options: ["Writing code 💻", "Making apps intuitive and easy to use 🎨", "Testing for bugs 🐛", "Marketing the app 📢"],
        correctIndex: 1,
        explanation: "UX (User Experience) designers focus on making apps feel natural and intuitive — ensuring users can accomplish tasks without confusion!",
      },
      {
        kind: "quiz",
        question: "Why do QA testers try to make apps crash?",
        options: ["For fun 😄", "To find bugs before users do 🔨", "To make the app slower 🐌", "To delete data 🗑️"],
        correctIndex: 1,
        explanation: "Quality Assurance (QA) testers deliberately try to break apps in unusual ways to find bugs and fix them before real users encounter them!",
      },
      {
        kind: "quiz",
        question: "What happens AFTER an app launches?",
        options: ["Nothing — it's done 🛑", "Developers continuously improve it based on user data 📊", "It gets deleted 🗑️", "Users write the code 👤"],
        correctIndex: 1,
        explanation: "After launch, teams analyze how users actually use the app and continuously release updates and improvements. Great apps are always evolving!",
      },
      {
        kind: "celebrate",
        message: "App Builder Certified! 🛠️🏆 You now know exactly how the apps you love go from an idea to a product used by millions! Could you be next?",
      },
    ],
  },

  // ─── LESSON 14 ────────────────────────────────────────────────────────────────
  {
    id: "tech-14",
    title: "Big Data & How AI Learns",
    tagline: "The fuel that powers the AI revolution",
    emoji: "📈",
    ageMin: 11,
    colors: ["#0891B2", "#0E7490"],
    slides: [
      {
        kind: "hook",
        title: "Big Data: The Oil of the Digital Age! 📈",
        body: "Data is the most valuable resource in the world today — more valuable than oil! 🛢️ Every click, every search, every photo generates data. And AI FEEDS on this data to become smarter. Understanding big data means understanding the fuel behind the entire AI revolution! Let's dig in! ⛏️",
        visual: "📊🛢️🤖",
      },
      {
        kind: "story",
        heading: "What Is Big Data?",
        body: "Big Data is data so MASSIVE and complex that regular computers can't process it! 🌊 We create 2.5 QUINTILLION bytes of data every single day. That's 2,500,000,000,000,000,000 bytes! It comes from social media, sensors, GPS, medical records, satellites — everything digital creates data! Big Data needs special tools to make sense of it.",
        visual: "🌊💾📡",
      },
      {
        kind: "story",
        heading: "The Three Vs of Big Data",
        body: "Scientists describe Big Data with three Vs! 📊 VOLUME: the sheer amount (think petabytes of data). VELOCITY: how fast it's generated (millions of tweets per minute). VARIETY: different types — text, images, video, sensor readings, GPS coordinates. AI must handle all three to extract useful insights!",
        visual: "📊⚡🌈",
      },
      {
        kind: "story",
        heading: "Data is Collected Everywhere",
        body: "You're generating data right now! 📡 Your phone tracks location every few seconds. Smart watches record your heart rate. Netflix logs every pause and rewind. Supermarket loyalty cards track every purchase. Traffic cameras count cars. Scientists even analyze satellite images to count trees and measure glaciers. Everything is data!",
        visual: "📡❤️🛒",
      },
      {
        kind: "story",
        heading: "How AI Uses Big Data",
        body: "AI is useless without data — like a student with no textbooks! 📚 Companies feed their AI models billions of examples. Amazon's recommendation AI has analyzed TRILLIONS of purchases to know what you might want next. Google trained its translation AI on billions of translated documents. More data = smarter AI!",
        visual: "🤖📚🎯",
      },
      {
        kind: "story",
        heading: "Privacy: Who Owns Your Data?",
        body: "Here's the big question: when you use a free app, YOU are the product! 💭 Companies collect your data, analyze it, and sell insights to advertisers. Many countries now have laws protecting your data rights — like Europe's GDPR. You have the right to know what data is collected about you and ask for it to be deleted!",
        visual: "💭🔐⚖️",
      },
      {
        kind: "fact",
        label: "Data Universe Fact!",
        fact: "By 2025, humans will create 463 EXABYTES of data every single day! 🌌 An exabyte is 1 billion gigabytes. If you stored all that data on DVDs, the stack would reach from Earth to the Moon and back 23 times — every single day! The data universe grows faster than any resource in history!",
        visual: "🌌💿🌙",
      },
      {
        kind: "quiz",
        question: "What makes data 'Big Data'?",
        options: ["Data about big things 🏔️", "Data so massive and complex regular computers can't process it 🌊", "Data from big companies 🏢", "Data files over 1GB 💾"],
        correctIndex: 1,
        explanation: "Big Data refers to datasets so massive, fast-moving, and varied that they require special distributed computing systems and tools to process!",
      },
      {
        kind: "quiz",
        question: "What are the Three Vs of Big Data?",
        options: ["Very, Vast, Valid", "Volume, Velocity, Variety 📊", "Visual, Virtual, Valid", "Video, Voice, Vision"],
        correctIndex: 1,
        explanation: "The Three Vs are Volume (how much), Velocity (how fast), and Variety (what types) — the three main challenges of working with Big Data!",
      },
      {
        kind: "quiz",
        question: "When you use a free app, what are you really paying with?",
        options: ["Time ⏰", "Your personal data 📊", "Nothing at all 🎁", "Future money 💰"],
        correctIndex: 1,
        explanation: "Free apps are funded by advertising. Companies collect your data, analyze your behavior and preferences, and sell insights to advertisers who target you!",
      },
      {
        kind: "celebrate",
        message: "Data Scientist in Training! 📈🏆 You understand the invisible resource that powers our digital world. Data literacy is a superpower for the 21st century!",
      },
    ],
  },

  // ─── LESSON 15 ────────────────────────────────────────────────────────────────
  {
    id: "tech-15",
    title: "Self-Driving Cars & AI",
    tagline: "How AI navigates the real world",
    emoji: "🚗",
    ageMin: 12,
    colors: ["#D946EF", "#A21CAF"],
    slides: [
      {
        kind: "hook",
        title: "Self-Driving Cars: AI Behind the Wheel! 🚗",
        body: "Imagine a car that drives perfectly without any human — no hands on the wheel, no feet on the pedals! These cars already exist and are driving on real roads today. The AI inside makes thousands of decisions per second. Let's explore this incredible technology! 🤖",
        visual: "🚗🤖✨",
      },
      {
        kind: "story",
        heading: "The 5 Levels of Autonomy",
        body: "Not all self-driving is the same! 📊 Level 0: fully human. Level 1: cruise control (human + some assist). Level 2: steering AND braking automated (Tesla's Autopilot). Level 3: car handles driving, human ready to take over. Level 4: fully autonomous in most conditions. Level 5: perfectly autonomous anywhere. We're currently between 2-3!",
        visual: "📊🚗🤖",
      },
      {
        kind: "story",
        heading: "The Sensor Suite: The Car's Eyes",
        body: "Self-driving cars are covered in sensors! 👁️ LIDAR shoots laser beams in 360° and creates a 3D map of surroundings updated 10 times per second. RADAR measures the speed of nearby objects. Multiple CAMERAS see lane markings and traffic lights. GPS knows exact location. Together, these sensors see far better than any human driver!",
        visual: "👁️📡🗺️",
      },
      {
        kind: "story",
        heading: "Making Split-Second Decisions",
        body: "The AI must make decisions in milliseconds! ⚡ It processes all sensor data simultaneously: 'Pedestrian is 15m ahead, moving at 1.2 m/s toward road → calculate brake timing → will stop 3m before pedestrian.' Every object gets tracked and predicted. The AI plans its route 3-5 seconds ahead, continuously updating!",
        visual: "⚡🧠🎯",
      },
      {
        kind: "story",
        heading: "How Self-Driving AI is Trained",
        body: "Waymo's self-driving AI has driven over 32 MILLION real kilometers AND 20 BILLION kilometers in simulation! 🔢 The simulation runs millions of 'what if' scenarios: 'What if a child runs into the road? What if the road is icy? What if traffic lights malfunction?' Real and simulated experience together create superhuman driving!",
        visual: "🔢🌍💻",
      },
      {
        kind: "story",
        heading: "The Challenges That Remain",
        body: "Self-driving cars face incredibly hard edge cases! 🤔 How do you handle a construction zone with no lane markings? A police officer gesturing to stop? A plastic bag blowing across the road vs. a rock? Faded white lines in heavy rain? These rare scenarios are BRUTALLY difficult for AI but trivial for experienced human drivers!",
        visual: "🤔⚠️🌧️",
      },
      {
        kind: "fact",
        label: "Self-Driving Safety Fact!",
        fact: "Waymo's robotaxis in San Francisco have given over 700,000 paid rides with ZERO serious accidents caused by the AI! 🏆 Human drivers cause 1 accident per million miles. Waymo is 10x safer! The main risk is human drivers hitting the robotaxis — proof that humans are the bigger danger on roads!",
        visual: "🏆🚗✅",
      },
      {
        kind: "quiz",
        question: "What does LIDAR do in a self-driving car?",
        options: ["Controls the steering wheel 🎮", "Creates a 3D laser map of surroundings 👁️", "Checks the GPS location 📍", "Monitors tire pressure 🔧"],
        correctIndex: 1,
        explanation: "LIDAR fires laser pulses in all directions and measures their return time to create a detailed, real-time 3D map of everything around the car!",
      },
      {
        kind: "quiz",
        question: "At which level does a Tesla Autopilot operate?",
        options: ["Level 0 (manual)", "Level 2 (steering and braking automated) 🚗", "Level 4 (fully autonomous)", "Level 5 (perfect automation)"],
        correctIndex: 1,
        explanation: "Tesla Autopilot is Level 2 — it automates both steering and braking, but a human driver must stay alert and ready to take control at any moment!",
      },
      {
        kind: "quiz",
        question: "Why is simulation training important for self-driving AI?",
        options: ["It's cheaper than real cars 💰", "It lets AI experience billions of rare 'what if' scenarios safely 🌍", "Simulations are more accurate than real roads ✅", "It doesn't require cameras 📸"],
        correctIndex: 1,
        explanation: "Simulations let AI safely experience millions of rare and dangerous scenarios — bad weather, pedestrian surprises, equipment failures — that can't be tested on real roads!",
      },
      {
        kind: "celebrate",
        message: "Autonomous Tech Expert! 🚗🏆 You understand one of the most complex AI systems ever built. Self-driving technology is reshaping transportation — and you understand how!",
      },
    ],
  },

  // ─── LESSON 16 ────────────────────────────────────────────────────────────────
  {
    id: "tech-16",
    title: "AI in Medicine & Science",
    tagline: "How AI is saving millions of lives",
    emoji: "🏥",
    ageMin: 12,
    colors: ["#0EA5E9", "#0C4A6E"],
    slides: [
      {
        kind: "hook",
        title: "AI Is Saving Lives Every Single Day! 🏥",
        body: "AI is now detecting cancer before doctors can see it with their own eyes. It's designing new drugs in weeks instead of decades. It's predicting diseases before symptoms appear. Medical AI might be the most important technology in human history — let's explore how it works! ❤️",
        visual: "🏥❤️✨",
      },
      {
        kind: "story",
        heading: "AI Reading Medical Images",
        body: "Radiologists spend years learning to read X-rays and MRI scans. Now AI can do it in seconds — and often better! 🔬 Google's AI detected breast cancer from mammograms with 11% FEWER false negatives than human radiologists. It spotted early-stage cancers that human eyes missed. AI doesn't get tired or distracted at hour 12 of work!",
        visual: "🔬👁️🧠",
      },
      {
        kind: "story",
        heading: "Drug Discovery: Decades to Weeks",
        body: "Finding new medicines traditionally takes 10-15 YEARS and costs billions of dollars. 💊 AI is changing this completely! DeepMind's AlphaFold AI solved a 50-year biology mystery — predicting how proteins fold — in months. This is helping scientists design drugs for Alzheimer's, cancer, and infectious diseases at unprecedented speed!",
        visual: "💊⚡🧬",
      },
      {
        kind: "story",
        heading: "Predicting Disease Before It Strikes",
        body: "AI can predict who will get sick BEFORE they have any symptoms! 🔮 By analyzing patterns in medical records, genetics, lifestyle, and even retina scans, AI can predict heart attacks, diabetes, and Parkinson's disease years in advance. This allows doctors to intervene early — when treatment is most effective!",
        visual: "🔮❤️⏰",
      },
      {
        kind: "story",
        heading: "Surgical Robots: Precision Beyond Human Hands",
        body: "The da Vinci surgical robot performs minimally invasive surgery with superhuman precision! 🦾 It translates a surgeon's hand movements into micro-scale movements inside the body — filtering out any hand tremors. Cuts are 10x smaller than traditional surgery. Patients recover in days instead of weeks!",
        visual: "🦾🎯❤️",
      },
      {
        kind: "story",
        heading: "AI Fighting Epidemics and Pandemics",
        body: "AI helped track COVID-19 spread, discover vaccines faster, and identify who was most at risk! 🌍 Bluedot, a Canadian AI company, detected the COVID outbreak 9 DAYS before the World Health Organization warned the public — by analyzing flight patterns and infectious disease data. AI is becoming our early warning system!",
        visual: "🌍⚠️💊",
      },
      {
        kind: "fact",
        label: "Life-Saving AI Fact!",
        fact: "AI-driven drug discovery startup Insilico Medicine found a new drug candidate for lung fibrosis in just 18 MONTHS — a process that normally takes 4-5 years! 🚀 The AI designed over 30,000 candidate molecules and narrowed them to the best one. The drug is now in human clinical trials. AI is rewriting the timeline of medicine!",
        visual: "🚀💊🌟",
      },
      {
        kind: "quiz",
        question: "What did Google's AI do better than human radiologists?",
        options: ["Perform surgeries 🔪", "Detect breast cancer with fewer false negatives 🔬", "Prescribe medications 💊", "Write medical reports 📝"],
        correctIndex: 1,
        explanation: "Google's AI detected breast cancer from mammograms with 11% fewer false negatives than human radiologists — finding cancers that human eyes missed!",
      },
      {
        kind: "quiz",
        question: "What 50-year mystery did AlphaFold solve?",
        options: ["Cure for cancer 💊", "How proteins fold into their 3D shapes 🧬", "The origin of viruses 🦠", "How neurons connect 🧠"],
        correctIndex: 1,
        explanation: "AlphaFold predicted how proteins fold — a problem biologists had struggled with for 50 years. This breakthrough is accelerating drug discovery for countless diseases!",
      },
      {
        kind: "quiz",
        question: "How early did AI detect COVID-19 before official warnings?",
        options: ["1 day before 📅", "9 days before ⚠️", "1 month before 📆", "It didn't detect it 🚫"],
        correctIndex: 1,
        explanation: "Bluedot's AI detected the COVID-19 outbreak 9 days before the WHO issued public warnings, by analyzing airline ticket data and disease reports!",
      },
      {
        kind: "celebrate",
        message: "Medical AI Pioneer! 🏥🏆 You understand how AI is transforming medicine and saving millions of lives. This is technology at its most meaningful!",
      },
    ],
  },

  // ─── LESSON 17 ────────────────────────────────────────────────────────────────
  {
    id: "tech-17",
    title: "The Future of Technology",
    tagline: "What the next 20 years will look like",
    emoji: "🚀",
    ageMin: 13,
    colors: ["#A855F7", "#7E22CE"],
    slides: [
      {
        kind: "hook",
        title: "The Future Is Here — And It's Incredible! 🚀",
        body: "You are growing up in the most extraordinary era in human history. The technologies being developed right NOW will transform medicine, space, education, and everyday life beyond recognition. Get ready — this is YOUR future! 🌌",
        visual: "🚀🌌✨",
      },
      {
        kind: "story",
        heading: "Quantum Computing: Beyond All Limits",
        body: "Regular computers use bits (0 or 1). Quantum computers use QUBITS that can be 0 AND 1 simultaneously! ⚛️ This 'superposition' lets them solve certain problems millions of times faster. A quantum computer could crack today's encryption in minutes — or design materials that room-temperature superconductors are made of, solving energy problems forever!",
        visual: "⚛️💻⚡",
      },
      {
        kind: "story",
        heading: "Virtual and Augmented Reality",
        body: "VR puts you inside a completely digital world. AR overlays digital information on the real world! 🥽 Surgeons already use AR to see patient data projected onto their body during operations. Students walk through ancient Rome in VR. Within 10 years, AR glasses may replace smartphones — you'll see digital information everywhere you look!",
        visual: "🥽🌍📱",
      },
      {
        kind: "story",
        heading: "Brain-Computer Interfaces",
        body: "Neuralink is developing chips implanted in the human brain to interface directly with computers! 🧠 A paralyzed patient can already control a computer mouse just by THINKING about moving it. In the future, you might type by thinking, learn new skills by downloading them, or control AR overlays with your mind. The boundary between human and machine is blurring!",
        visual: "🧠💻🔮",
      },
      {
        kind: "story",
        heading: "Space Tech and AI Colonization",
        body: "SpaceX's Starship — the largest rocket ever built — is designed to carry 100 people to Mars! 🌌 AI will plan and manage the journey, monitor life support, and help establish the first human colony on another planet. You might live to see the first Martian city. The generation being born today may never know a world without space travel!",
        visual: "🌌🚀🔴",
      },
      {
        kind: "story",
        heading: "AI That Creates Like an Artist",
        body: "Generative AI creates original art, music, code, and text from simple prompts! 🎨 DALL-E creates photorealistic images from descriptions. Sora generates full movies from text. AI musicians compose symphonies. AI programmers write apps. This isn't replacing human creativity — it's giving everyone creative superpowers, regardless of artistic training!",
        visual: "🎨🎵💻",
      },
      {
        kind: "fact",
        label: "Future Technology Timeline Fact!",
        fact: "Experts predict: by 2030, AI will be smarter than any human at most cognitive tasks. By 2040, self-driving vehicles will outnumber human-driven ones. By 2050, the first human Mars colony may be established. And nuclear fusion — unlimited clean energy — could be commercially available within 15 years. You'll see ALL of this in your lifetime! 🌟",
        visual: "🌟🔭🌍",
      },
      {
        kind: "quiz",
        question: "What makes quantum computers revolutionary?",
        options: ["They're faster at the same tasks 💨", "Qubits can be 0 AND 1 simultaneously ⚛️", "They don't need electricity ⚡", "They're smaller than regular computers 🔬"],
        correctIndex: 1,
        explanation: "Quantum computers use qubits that can be in a superposition of 0 and 1 at the same time — allowing them to solve certain problems exponentially faster than regular computers!",
      },
      {
        kind: "quiz",
        question: "What is Augmented Reality?",
        options: ["A completely digital virtual world 🌐", "Digital information overlaid on the real world 🥽", "A type of AI 🤖", "High-definition cameras 📸"],
        correctIndex: 1,
        explanation: "Augmented Reality (AR) overlays digital information — images, data, labels — on top of what you see in the real world, enhancing reality rather than replacing it!",
      },
      {
        kind: "quiz",
        question: "What does Neuralink aim to achieve?",
        options: ["Better smartphone batteries 🔋", "Direct brain-computer communication 🧠", "Faster internet 📡", "Smarter home appliances 🏠"],
        correctIndex: 1,
        explanation: "Neuralink is developing brain implants that allow direct communication between the human brain and computers — letting people control devices by thought alone!",
      },
      {
        kind: "celebrate",
        message: "Future Visionary! 🚀🏆 You understand the technologies that will define your lifetime. You're not just ready for the future — you're ready to help BUILD it!",
      },
    ],
  },

  // ─── LESSON 18 ────────────────────────────────────────────────────────────────
  {
    id: "tech-18",
    title: "AI Ethics: Rules for AI",
    tagline: "Who is responsible when AI makes mistakes?",
    emoji: "⚖️",
    ageMin: 13,
    colors: ["#F97316", "#9A3412"],
    slides: [
      {
        kind: "hook",
        title: "AI Ethics: The Most Important Conversation of Our Time! ⚖️",
        body: "AI is making decisions that affect millions of lives — who gets a loan, who gets interviewed for a job, who gets paroled from prison. But what if AI is WRONG? Or UNFAIR? Or BIASED? This isn't science fiction — these problems are happening RIGHT NOW. Let's explore! 🌍",
        visual: "⚖️🤔🌍",
      },
      {
        kind: "story",
        heading: "What Is AI Bias?",
        body: "AI learns from human data — and humans have biases. So AI can inherit those biases! 🔄 Amazon built an AI to screen job applications. The AI learned from 10 years of hiring data — when Amazon mostly hired men. Result: the AI automatically downgraded resumes with the word 'women's.' Amazon had to scrap it. Biased data → biased AI!",
        visual: "🔄📊⚠️",
      },
      {
        kind: "story",
        heading: "Facial Recognition and Fairness",
        body: "Facial recognition AI is dramatically less accurate for darker skin tones! 🔬 MIT research showed error rates of 1% for light-skinned men — but 35% for dark-skinned women. Why? The training data had far more light-skinned faces. When this AI is used by police to identify suspects, the consequences of errors are devastating!",
        visual: "👤⚠️🔬",
      },
      {
        kind: "story",
        heading: "Who Is Responsible When AI Is Wrong?",
        body: "When a self-driving car causes an accident, who is at fault? 🚗 The passenger? The company that built the AI? The programmer? The dataset curator? This question has no easy answer — and courts around the world are still figuring it out! AI creates entirely new legal and ethical questions that humanity has never faced before!",
        visual: "🚗⚖️❓",
      },
      {
        kind: "story",
        heading: "AI Transparency: The Black Box Problem",
        body: "Modern AI — especially deep learning — is a 'black box.' 📦 Even its creators can't fully explain WHY it makes certain decisions! This is terrifying when AI decides credit scores, medical diagnoses, or criminal sentences. A doctor can explain their reasoning. An AI often cannot. 'Explainable AI' is a whole field trying to solve this!",
        visual: "📦❓🔍",
      },
      {
        kind: "story",
        heading: "AI Regulations Around the World",
        body: "Governments are now writing laws for AI! 📜 The EU's AI Act is the world's first comprehensive AI law — banning some AI uses entirely (like social scoring) and requiring transparency for others. China, the US, and the UK are developing their own frameworks. Getting these rules right will determine whether AI helps or harms humanity!",
        visual: "📜🌍⚖️",
      },
      {
        kind: "story",
        heading: "You Will Help Shape AI Ethics",
        body: "Here's the most important message: AI ethics isn't just for engineers — it needs philosophers, lawyers, artists, scientists, and people from every background! 🌈 The decisions about how AI is built, trained, and regulated will affect every human on Earth. YOUR perspective — your values, your culture, your voice — matters in shaping fair AI!",
        visual: "🌈🌍💡",
      },
      {
        kind: "fact",
        label: "AI Ethics Reality Fact!",
        fact: "In the United States, an AI called COMPAS was used to predict recidivism — whether criminals would re-offend — to help judges decide sentences! 🔨 Investigations found it was TWICE as likely to falsely flag Black defendants as high-risk compared to white defendants. Real people served longer sentences because of biased AI. This is why ethics matters!",
        visual: "⚖️🔨⚠️",
      },
      {
        kind: "quiz",
        question: "What is AI bias?",
        options: ["AI that is too slow 🐌", "AI that inherits unfair patterns from biased training data 📊", "AI that overheats 🌡️", "AI that makes math errors 🔢"],
        correctIndex: 1,
        explanation: "AI bias occurs when AI learns unfair patterns from biased training data — like an AI that discriminates because it was trained mostly on data from one group!",
      },
      {
        kind: "quiz",
        question: "What is the 'black box' problem with AI?",
        options: ["AI that runs in the dark 🌑", "AI whose decision-making process can't be fully explained ❓", "AI that only works offline 📴", "AI that's painted black 🖤"],
        correctIndex: 1,
        explanation: "The black box problem is that even AI creators often can't fully explain why deep learning AI makes specific decisions — making accountability and trust very difficult!",
      },
      {
        kind: "quiz",
        question: "Why does facial recognition AI work worse on darker skin tones?",
        options: ["Camera quality 📸", "Training datasets had far fewer darker-skinned faces 📊", "Lighting differences 💡", "Different facial structures 👤"],
        correctIndex: 1,
        explanation: "Facial recognition AI was primarily trained on datasets with mostly lighter-skinned faces, so it learned less accurate patterns for darker skin tones — a direct result of unrepresentative data!",
      },
      {
        kind: "celebrate",
        message: "AI Ethics Champion! ⚖️🏆 You understand that technology must be built responsibly and fairly. The world needs thoughtful people like you to guide AI toward justice and equality!",
      },
    ],
  },
];
