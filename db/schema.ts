import {sqliteTable, text, integer, real, index, uniqueIndex} from 'drizzle-orm/sqlite-core';
export const researchNotes=sqliteTable('research_notes',{
 userId:text('user_id').notNull(),questionId:text('question_id').notNull(),content:text('content').notNull(),revision:integer('revision').notNull().default(1),updatedAt:integer('updated_at').notNull(),
},t=>[uniqueIndex('research_notes_user_question').on(t.userId,t.questionId)]);
export const sources = sqliteTable('library_sources', {
 id:text('id').primaryKey(),kind:text('kind').notNull(),title:text('title').notNull(),authors:text('authors').notNull().default(''),
 publisher:text('publisher').notNull().default(''),identifier:text('identifier').notNull().default(''),officialUrl:text('official_url').notNull().default(''),
 topics:text('topics').notNull().default(''),createdAt:text('created_at').notNull(),
});
export const versions = sqliteTable('library_versions', {
 id:text('id').primaryKey(),sourceId:text('source_id').notNull().references(()=>sources.id),label:text('label').notNull(),
 publishedOn:text('published_on').notNull().default(''),validFrom:text('valid_from').notNull().default(''),validUntil:text('valid_until').notNull().default(''),
 capturedAt:text('captured_at').notNull(),objectKey:text('object_key'),filename:text('filename'),mime:text('mime'),size:integer('size'),sha256:text('sha256'),
 status:text('status').notNull().default('declared'),createdBy:text('created_by').notNull(),
},t=>[index('library_versions_source').on(t.sourceId)]);
export const passages=sqliteTable('library_passages', {
 id:text('id').primaryKey(),versionId:text('version_id').notNull().references(()=>versions.id),page:integer('page').notNull(),
 printedPage:text('printed_page').notNull().default(''),locator:text('locator').notNull().default(''),content:text('content').notNull(),
 method:text('method').notNull(),verified:integer('verified').notNull().default(0),
},t=>[uniqueIndex('library_passage_location').on(t.versionId,t.page,t.locator)]);
export const questions=sqliteTable('bank_questions', {
 id:text('id').primaryKey(),legacyNumber:integer('legacy_number').unique(),tecId:text('tec_id').unique(),source:text('source').notNull(),
 subject:text('subject').notNull(),prompt:text('prompt').notNull(),answerId:text('answer_id').notNull(),status:text('status').notNull(),origin:text('origin').notNull(),
 explanation:text('explanation').notNull().default(''),reviewNote:text('review_note').notNull().default(''),sourceUrl:text('source_url').notNull().default(''),referenceText:text('reference_text').notNull().default(''),image:text('image').notNull().default(''),imageAlt:text('image_alt').notNull().default(''),bankAnalysis:text('bank_analysis').notNull().default(''),reviewStatus:text('review_status').notNull().default('needs_review'),suggestedAnswer:integer('suggested_answer'),createdAt:text('created_at').notNull(),updatedAt:text('updated_at').notNull(),
},t=>[index('bank_question_status').on(t.status)]);
export const options=sqliteTable('bank_options', {
 id:text('id').primaryKey(),questionId:text('question_id').notNull().references(()=>questions.id),position:integer('position').notNull(),
 content:text('content').notNull(),analysis:text('analysis').notNull().default(''),
},t=>[uniqueIndex('bank_option_order').on(t.questionId,t.position)]);
export const citations=sqliteTable('bank_citations', {
 id:text('id').primaryKey(),questionId:text('question_id').notNull().references(()=>questions.id),optionId:text('option_id').references(()=>options.id),
 versionId:text('version_id').notNull().references(()=>versions.id),passageId:text('passage_id').references(()=>passages.id),role:text('role').notNull(),
 locator:text('locator').notNull().default(''),note:text('note').notNull().default(''),verified:integer('verified').notNull().default(0),
},t=>[index('bank_citation_question').on(t.questionId),index('bank_citation_version').on(t.versionId)]);
export const meta=sqliteTable('library_meta',{key:text('key').primaryKey(),value:text('value').notNull()});
export const audit=sqliteTable('library_audit',{id:text('id').primaryKey(),actor:text('actor').notNull(),action:text('action').notNull(),target:text('target').notNull(),createdAt:text('created_at').notNull()});

export const studyProgress = sqliteTable('study_progress', {
 id:text('id').primaryKey(),userId:text('user_id').notNull(),questionId:text('question_id').notNull(),
 attempts:integer('attempts').notNull(),correct:integer('correct').notNull(),lastCorrect:integer('last_correct').notNull(),confidence:text('confidence').notNull(),
 intervalDays:integer('interval_days').notNull(),dueAt:integer('due_at').notNull(),lastAt:integer('last_at').notNull(),
 firstCorrect:integer('first_correct').notNull(),delayedAttempts:integer('delayed_attempts').notNull(),delayedCorrect:integer('delayed_correct').notNull(),
 note:text('note').notNull().default(''),errorKind:text('error_kind').notNull().default(''),
 noteRevision:integer('note_revision').notNull().default(0),
 stability:real('stability').notNull().default(1),difficulty:real('difficulty').notNull().default(5),
 lapses:integer('lapses').notNull().default(0),
 fsrsState:integer('fsrs_state').notNull().default(2),fsrsReps:integer('fsrs_reps').notNull().default(0),learningSteps:integer('learning_steps').notNull().default(0),
},t=>[uniqueIndex('study_progress_user_question').on(t.userId,t.questionId)]);
export const studyAttempts = sqliteTable('study_attempts', {
  id:text('id').primaryKey(),userId:text('user_id').notNull(),questionId:text('question_id').notNull(),
 ordinal:integer('ordinal').notNull(),
  selected:integer('selected').notNull(),confidence:text('confidence').notNull(),correct:integer('correct').notNull(),createdAt:integer('created_at').notNull(),
  memoryRating:integer('memory_rating').notNull().default(0),ratingSource:text('rating_source').notNull().default('inferred'),
  responseMs:integer('response_ms').notNull().default(0),scheduledDays:integer('scheduled_days').notNull().default(0),elapsedDays:integer('elapsed_days').notNull().default(0),schedulerVersion:text('scheduler_version').notNull().default('legacy'),
  studyMs:integer('study_ms').notNull().default(0),
},t=>[uniqueIndex('study_attempts_sequence').on(t.userId,t.questionId,t.ordinal)]);

export const studyPlans=sqliteTable('study_plans',{
 userId:text('user_id').notNull(),program:text('program').notNull(),minutes:integer('minutes').notNull(),days:text('days').notNull(),updatedAt:integer('updated_at').notNull(),
},t=>[uniqueIndex('study_plans_user_program').on(t.userId,t.program)]);
