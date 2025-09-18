// ==================== scripts/initDb.js ====================
const { db, pool } = require('../config/database');
const { 
  images, 
  instructors, 
  courses, 
  courseInstructors,
  sections,
  chapters,
  tests,
  questions,
  options,
  videos
} = require('../config/schema');

async function initializeDatabase() {
  try {
    console.log('Starting database initialization with sample data...');
    
    // Add sample data
    await addSampleData();
    
    console.log('Database initialized successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await pool.end();
  }
}

async function addSampleData() {
  try {
    await db.transaction(async (tx) => {
      console.log('Adding sample data...');

      // Add sample image
      const imageResult = await tx
        .insert(images)
        .values({
          imageUrl: 'https://example.com/sample-course.jpg',
          altText: 'Sample course image',
        })
        .returning();
      
      const imageId = imageResult[0].imageId;
      console.log('✓ Sample image added');

      // Add sample video
      const videoResult = await tx
        .insert(videos)
        .values({
          title: 'Introduction to Programming Video',
          description: 'Welcome to our programming course',
          slidesUrl: 'https://example.com/slides/intro',
          imageId: imageId,
        })
        .returning();
      
      const videoId = videoResult[0].videoId;
      console.log('✓ Sample video added');

      // Add sample instructor
      const instructorResult = await tx
        .insert(instructors)
        .values({
          name: 'John Doe',
          bio: 'Experienced educator with 10+ years in software development',
          imageId: imageId,
        })
        .returning();
      
      const instructorId = instructorResult[0].instructorId;
      console.log('✓ Sample instructor added');

      // Add sample course
      const courseResult = await tx
        .insert(courses)
        .values({
          courseName: 'Introduction to Programming',
          description: 'Learn the fundamentals of programming with hands-on examples',
          imageId: imageId,
          videoId: videoId,
        })
        .returning();
      
      const courseId = courseResult[0].courseId;
      console.log('✓ Sample course added');

      // Link instructor to course
      await tx
        .insert(courseInstructors)
        .values({
          courseId: courseId,
          instructorId: instructorId,
        });
      console.log('✓ Instructor-course relationship added');

      // Add sample section
      const sectionResult = await tx
        .insert(sections)
        .values({
          courseId: courseId,
          title: 'Getting Started',
          description: 'Introduction to programming concepts',
          imageId: imageId,
          videoId: videoId,
        })
        .returning();
      
      const sectionId = sectionResult[0].sectionId;
      console.log('✓ Sample section added');

      // Add sample chapter
      const chapterResult = await tx
        .insert(chapters)
        .values({
          sectionId: sectionId,
          chapterNumber: 1,
          title: 'Variables and Data Types',
          description: 'Learn about variables and different data types',
          imageId: imageId,
        })
        .returning();
      
      const chapterId = chapterResult[0].chapterId;
      console.log('✓ Sample chapter added');

      // Add sample test
      const testResult = await tx
        .insert(tests)
        .values({
          chapterId: chapterId,
          title: 'Variables Quiz',
          description: 'Test your knowledge of variables and data types',
          imageId: imageId,
          videoId: videoId,
        })
        .returning();
      
      const testId = testResult[0].testId;
      console.log('✓ Sample test added');

      // Add sample question
      const questionResult = await tx
        .insert(questions)
        .values({
          testId: testId,
          questionText: 'Which of the following is a valid variable name in most programming languages?',
        })
        .returning();
      
      const questionId = questionResult[0].questionId;
      console.log('✓ Sample question added');

      // Add sample options
      const optionValues = [
        {
          questionId: questionId,
          optionText: '2variable',
          isCorrect: false,
          explanation: 'Variable names cannot start with a number',
        },
        {
          questionId: questionId,
          optionText: 'my_variable',
          isCorrect: true,
          explanation: 'This follows proper naming conventions',
        },
        {
          questionId: questionId,
          optionText: 'my-variable',
          isCorrect: false,
          explanation: 'Hyphens are not allowed in most programming languages',
        },
        {
          questionId: questionId,
          optionText: 'class',
          isCorrect: false,
          explanation: 'This is a reserved keyword in many programming languages',
        },
      ];

      await tx.insert(options).values(optionValues);
      console.log('✓ Sample options added');

      console.log('\n🎉 Sample data successfully added to database!');
      console.log('\nYou can now:');
      console.log('- Start the server: npm run dev');
      console.log('- Visit: http://localhost:3000/api');
      console.log('- Check health: http://localhost:3000/health');
      console.log('- View courses: http://localhost:3000/api/courses');
    });
  } catch (error) {
    console.error('Error adding sample data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = { initializeDatabase, addSampleData };