CREATE DATABASE IF NOT EXISTS I75;
CREATE SCHEMA IF NOT EXISTS public;

CREATE TABLE IF NOT EXISTS public.images (
    image_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    image_url TEXT NOT NULL,
    alt_text TEXT,
    PRIMARY KEY (image_id)
);

CREATE TABLE IF NOT EXISTS public.videos (
    video_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    slides_url TEXT,
    image_id UUID,
    PRIMARY KEY (video_id),
    FOREIGN KEY (image_id) REFERENCES public.images(image_id)
);

CREATE TABLE IF NOT EXISTS public.instructors (
    instructor_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    bio TEXT,
    image_id UUID,
    PRIMARY KEY (instructor_id),
    FOREIGN KEY (image_id) REFERENCES public.images(image_id)
);

CREATE TABLE IF NOT EXISTS public.courses (
    course_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    course_name TEXT NOT NULL,
    description TEXT,
    image_id UUID,
    video_id UUID,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    UNIQUE (course_name),
    PRIMARY KEY (course_id),
    FOREIGN KEY (image_id) REFERENCES public.images(image_id),
    FOREIGN KEY (video_id) REFERENCES public.videos(video_id)
);

CREATE TABLE IF NOT EXISTS public.course_instructors (
    course_id UUID NOT NULL,
    instructor_id UUID NOT NULL,
    PRIMARY KEY (course_id, instructor_id),
    FOREIGN KEY (course_id) REFERENCES public.courses(course_id),
    FOREIGN KEY (instructor_id) REFERENCES public.instructors(instructor_id)
);

CREATE TABLE IF NOT EXISTS public.sections (
    section_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_id UUID,
    video_id UUID,
    UNIQUE (course_id),
    PRIMARY KEY (section_id),
    FOREIGN KEY (course_id) REFERENCES public.courses(course_id),
    FOREIGN KEY (image_id) REFERENCES public.images(image_id),
    FOREIGN KEY (video_id) REFERENCES public.videos(video_id)
);

CREATE TABLE IF NOT EXISTS public.chapters (
    chapter_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    section_id UUID NOT NULL,
    chapter_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_id UUID,
    PRIMARY KEY (chapter_id),
    FOREIGN KEY (section_id) REFERENCES public.sections(section_id),
    FOREIGN KEY (image_id) REFERENCES public.images(image_id)
);

CREATE TABLE IF NOT EXISTS public.tests (
    test_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    image_id UUID,
    video_id UUID,
    PRIMARY KEY (test_id),
    FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id),
    FOREIGN KEY (image_id) REFERENCES public.images(image_id),
    FOREIGN KEY (video_id) REFERENCES public.videos(video_id)
);

CREATE TABLE IF NOT EXISTS public.questions (
    question_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    test_id UUID NOT NULL,
    question_text TEXT NOT NULL,
    PRIMARY KEY (question_id),
    FOREIGN KEY (test_id) REFERENCES public.tests(test_id)
);

CREATE TABLE IF NOT EXISTS public.options (
    option_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    explanation TEXT,
    video_id UUID,
    PRIMARY KEY (option_id),
    FOREIGN KEY (question_id) REFERENCES public.questions(question_id),
    FOREIGN KEY (video_id) REFERENCES public.videos(video_id)
);

CREATE TABLE IF NOT EXISTS public.entries (
    entry_id UUID NOT NULL DEFAULT uuid_generate_v4(),
    chapter_id UUID NOT NULL,
    sequence_number INTEGER NOT NULL,
    test_id UUID,
    video_id UUID,
    PRIMARY KEY (entry_id),
    FOREIGN KEY (chapter_id) REFERENCES public.chapters(chapter_id),
    FOREIGN KEY (test_id) REFERENCES public.tests(test_id),
    FOREIGN KEY (video_id) REFERENCES public.videos(video_id)
);

CREATE TABLE IF NOT EXISTS public.option_images (
    option_id UUID NOT NULL,
    image_id UUID NOT NULL,
    PRIMARY KEY (option_id, image_id),
    FOREIGN KEY (option_id) REFERENCES public.options(option_id),
    FOREIGN KEY (image_id) REFERENCES public.images(image_id)
);

CREATE TABLE IF NOT EXISTS public.option_videos (
    option_id UUID NOT NULL,
    video_id UUID NOT NULL,
    PRIMARY KEY (option_id, video_id),
    FOREIGN KEY (option_id) REFERENCES public.options(option_id),
    FOREIGN KEY (video_id) REFERENCES public.videos(video_id)
);

CREATE TABLE IF NOT EXISTS public.question_images (
    question_id UUID NOT NULL,
    image_id UUID NOT NULL,
    PRIMARY KEY (question_id, image_id),
    FOREIGN KEY (question_id) REFERENCES public.questions(question_id),
    FOREIGN KEY (image_id) REFERENCES public.images(image_id)
);

CREATE TABLE IF NOT EXISTS public.question_videos (
    question_id UUID NOT NULL,
    video_id UUID NOT NULL,
    PRIMARY KEY (question_id, video_id),
    FOREIGN KEY (question_id) REFERENCES public.questions(question_id),
    FOREIGN KEY (video_id) REFERENCES public.videos(video_id)
);