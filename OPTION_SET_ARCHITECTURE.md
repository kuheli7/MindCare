# New Option Set Architecture

## Overview
The application now uses a **reusable Option Set system** instead of duplicating options for each question.

## Database Schema Changes

### 1. **OptionSet Schema** (NEW)
```
OptionSet {
  _id: ObjectId,
  set_name: String (unique),
  description: String,
  created_at: Date
}
```
- Represents a reusable set of predefined options
- Multiple questions can reference the same OptionSet

### 2. **Option Schema** (MODIFIED)
```
Option {
  _id: ObjectId,
  option_set_id: ObjectId (ref: OptionSet),  // NOW REFERENCES OPTIONSET
  option_text: String,
  points: Number,
  order: Number
}
```
- Changed from `question_id` to `option_set_id`
- Options are now grouped by OptionSet, not by Question
- `order` field maintains the sequence of options

### 3. **Question Schema** (MODIFIED)
```
Question {
  _id: ObjectId,
  domain_id: ObjectId,
  assessment_type_id: ObjectId,
  question_text: String,
  option_set_id: ObjectId (ref: OptionSet),  // NEW
  weight: Number
}
```
- Now references an OptionSet instead of having individual options

## API Endpoints

### Option Set Management
- `GET /api/option-sets` - Get all option sets with their options
- `GET /api/option-sets/:id` - Get a specific option set with options
- `POST /api/option-sets` - Create a new option set
- `PUT /api/option-sets/:id` - Update an option set
- `DELETE /api/option-sets/:id` - Delete an option set (and its options)

### Option Management
- `GET /api/options/set/:optionSetId` - Get all options for a specific option set
- `POST /api/options` - Create a new option (requires `option_set_id`)
- `PUT /api/options/:id` - Update an option
- `DELETE /api/options/:id` - Delete an option

### Question Management (UPDATED)
- `POST /api/questions` - Create question (now requires `option_set_id`)
- `GET /api/domains/questions-by-domains/:domainNames` - Get questions with populated options

## Current Option Sets

### 1. Likert Scale 5 (Never-Always)
**ID**: 699c0eb85d55f81a34f2f632
- Never (0 points)
- Rarely (1 point)
- Sometimes (2 points)
- Often (3 points)
- Almost Always (4 points)

**Used by**: Stress, Anxiety, Depression, and Burnout domain questions

### 2. Sleep Scale 4 (Past Month)
**ID**: 699c0eb85d55f81a34f2f633
- Not during the past month (0 points)
- Less than once a week (1 point)
- Once or twice a week (2 points)
- Three or more times a week (3 points)

**Used by**: Sleep Assessment questions (optional)

## Benefits

✅ **No Duplication** - Same 5 options used across multiple questions
✅ **Efficient** - Creates options once, references many times
✅ **Scalable** - Easy to create new option sets for different question types
✅ **Maintainable** - Update an option set once, affects all referencing questions
✅ **Flexible** - Add custom option sets as needed

## Example Usage

### Create a Question
```json
POST /api/questions
{
  "domain_id": "xxx",
  "assessment_type_id": "yyy",
  "question_text": "How often do you feel stressed?",
  "option_set_id": "699c0eb85d55f81a34f2f632",
  "weight": 1
}
```

### Create a Custom Option Set
```json
POST /api/option-sets
{
  "set_name": "Custom Scale",
  "description": "My custom scale"
}
```

### Add Options to Option Set
```json
POST /api/options
{
  "option_set_id": "xxx",
  "option_text": "Low",
  "points": 0,
  "order": 0
}
```
