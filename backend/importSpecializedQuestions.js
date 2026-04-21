import dotenv from "dotenv";
import connectDB from "./config/db.js";
import AssessmentType from "./models/AssessmentType.js";
import Domain from "./models/Domain.js";
import Question from "./models/Question.js";
import OptionSet from "./models/OptionSet.js";

dotenv.config();
if (!process.env.MONGO_URI) {
  dotenv.config({ path: "backend/.env" });
}

const SPECIALIZED_QUESTIONS = {
  Stress: [
    "In the last month, how often have you been upset because of something that happened unexpectedly?",
    "In the last month, how often have you felt nervous and stressed?",
    "In the last month, how often have you felt confident about your ability to handle your personal problems?",
    "In the last month, how often have you found that you could not cope with all the things that you had to do?",
    "In the last month, how often have you felt that things were going your way?",
    "You feel that too many demands are being made on you",
    "You are irritable or grouchy",
    "You feel lonely or isolated",
    "You find yourself in situations of conflict",
    "You feel tired",
    "You fear you may not manage to attain your goals",
    "You feel calm",
    "You have too many decisions to make",
    "You feel safe and protected",
    "You have many worries",
    "You are under pressure from other people",
    "You feel mentally exhausted",
    "You have trouble relaxing",
    "You feel under pressure from deadlines",
    "You feel rested"
  ],
  Anxiety: [
    "I was aware of dryness of my mouth",
    "I experienced breathing difficulty (e.g. excessively rapid breathing, breathlessness in the absence of physical exertion)",
    "I experienced trembling (e.g. in the hands)",
    "I was worried about situations in which I might panic and make a fool of myself",
    "I felt I was close to panic",
    "I was aware of the action of my heart in the absence of physical exertion (e.g. sense of heart rate increase, heart missing a beat)",
    "I felt scared without any good reason.",
    "In the last three months, have you often worried a lot before you were going to do some activity?",
    "In the last three months, have you found that it's hard to stop yourself from worrying?",
    "In the last 3 months, has being worried made it difficult for you to do your work, take care of things at home, or get along with other people?",
    "Are you the kind of person who is often very tense or who finds it very hard to relax?",
    "Feeling nervous, anxious, or on edge",
    "Trouble relaxing",
    "Becoming easily annoyed or irritable",
    "Feeling afraid, as if something awful might happen"
  ],
  Depression: [
    "I couldn't seem to experience any positive feeling at all",
    "I found it difficult to work up the initiative to do things",
    "I felt that I had nothing to look forward to",
    "I felt down-hearted and blue",
    "I was unable to become enthusiastic about anything",
    "I felt I wasn't worth much as a person",
    "I felt that life was meaningless",
    "Poor appetite or overeating",
    "Little interest or pleasure in doing things",
    "Feeling down, depressed, or hopeless",
    "Trouble falling or staying asleep, or sleeping too much",
    "Feeling tired or having little energy",
    "Feeling bad about yourself - or that you are a failure or have let yourself or your family down",
    "Trouble concentrating on things, such as reading the newspaper or watching television",
    "Thoughts that you would be better off dead, or of hurting yourself"
  ],
  Burnout: [
    "I feel mentally exhausted",
    "Everything I do requires a great deal of effort",
    "At the end of the day, I find it hard to recover my energy",
    "I feel physically exhausted",
    "When I get up in the morning, I lack the energy to start a new day",
    "When I exert myself, I quickly get tired",
    "I struggle to find any enthusiasm for my work",
    "I feel indifferent about my job",
    "I'm cynical about what my work means to others",
    "I have trouble staying focused",
    "I struggle to think clearly",
    "I make mistakes because I have my mind on other things",
    "I feel unable to control my emotions",
    "I become irritable when things don't go my way",
    "I may overreact unintentionally"
  ],
  Sleep: [
    "How often do you have difficulty falling asleep at night?",
    "How often do you wake up during the night and struggle to fall asleep again?",
    "How often do you wake up earlier than planned and feel unable to sleep again?",
    "How often do you feel like to sleep more after waking up?",
    "How often does academic stress disturb your sleep?",
    "How often do you use mobile phones or electronic devices just before sleeping?",
    "How often do you experience headaches or heaviness due to poor sleep?",
    "How often do you feel sleepy or drowsy during classes or study hours?",
    "How often you have difficulty getting out of bed?",
    "How often do you feel your sleep quality affects your work?",
    "During the past month, how would you rate your sleep quality overall?",
    "During the past month, how often have you taken medicine to help you sleep (prescribed or over the counter)?",
    "During the past month, how often have you had trouble staying awake while driving, eating meals, or engaging in social activity?",
    "During the past month, how much of a problem has it been for you to keep up enough enthusiasm to get things done?",
    "During the past month, how often have you had trouble sleeping because you cannot get to sleep within 30 minutes?"
  ]
};

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const run = async () => {
  try {
    await connectDB();

    const specializedType = await AssessmentType.findOne({ isSpecialized: true });
    if (!specializedType) {
      throw new Error("No specialized assessment type found. Create one first.");
    }

    const likertSet = await OptionSet.findOne({ set_name: /Likert/i });
    const sleepSet = await OptionSet.findOne({ set_name: /Sleep Scale/i });
    if (!likertSet || !sleepSet) {
      throw new Error("Option sets not found. Seed option sets first.");
    }

    for (const [domainName, questionTexts] of Object.entries(SPECIALIZED_QUESTIONS)) {
      const domainRegex = new RegExp(`^${escapeRegex(domainName)}$`, "i");
      const domain = await Domain.findOne({ domain_name: domainRegex });
      if (!domain) {
        console.warn(`Skipping ${domainName}: domain not found.`);
        continue;
      }

      // Re-runnable behavior: replace specialized set for this domain.
      await Question.deleteMany({
        domain_id: domain._id,
        assessment_type_id: specializedType._id
      });

      const optionSetId = domainName.toLowerCase() === "sleep" ? sleepSet._id : likertSet._id;

      const docs = questionTexts.map((text, index) => ({
        domain_id: domain._id,
        assessment_type_id: specializedType._id,
        question_text: text,
        option_set_id: optionSetId,
        order: index + 1,
        weight: 1
      }));

      await Question.insertMany(docs);
      console.log(`Inserted ${docs.length} specialized questions for ${domainName}.`);
    }

    console.log("Specialized question import complete.");
    process.exit(0);
  } catch (err) {
    console.error("Specialized question import failed:", err.message);
    process.exit(1);
  }
};

run();