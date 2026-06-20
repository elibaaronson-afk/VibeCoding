# trainer_app.tsx - Code Block Explanation

This document walks through the major blocks in `trainer_app.tsx`, describing the purpose of each section and the main components or functions it defines.

## 1. Imports and Top-Level Constants
- `import { useState, useEffect, useCallback, useRef } from "react";`
  - Brings in React hooks used across the app.
- `uid()`
  - Generates a short unique ID for objects like exercises, clients, and injuries.
- `STORAGE_KEY`
  - Local storage key used to persist client and library state.
- `DAYS`, `GOALS`, `LEVELS`, `MUSCLE_GROUPS`, `SEVERITY`, `INJURY_STATUS`, `BLOCK_TYPES`
  - Static option lists used throughout the UI for dropdowns, filters, and labels.
- `BLOCK_COLORS`
  - Maps training block types to UI color codes.
- `GOAL_PRESETS`
  - Defines default widget sets for each client goal.
- `ALL_WIDGETS`
  - A registry of available dashboard widgets with IDs, display names, icons, and tags.
- `EXERCISE_TAGS`
  - Tag names used for exercise library filtering and metadata.
- `DEFAULT_LIBRARY`
  - Sample exercise library data used when no saved library exists.
- `AV_COLORS`, `avColor()`, `initials()`
  - Avatar styling helpers for client profile bubbles.

## 2. Date Helpers
- `getWeekStart(offset)`
  - Returns the start date of the current week or a week offset.
- `getWeekDates(offset)`
  - Builds a list of the week’s date objects for display.
- `fmtDate()`, `fmtFull()`, `fmtLong()`, `fmtShort()`
  - Format JavaScript dates into readable strings.
- `weekKey(offset)`
  - Creates a normalized string key for a week based on its start date.
- `addDays(date,n)`
  - Adds days to a date and returns a new Date object.
- `dateToKey(d)`
  - Converts a date to `YYYY-MM-DD` key format.
- `jsDateDayName(d)`
  - Maps JavaScript day numbers to the `DAYS` array, with Monday first.

## 3. Persistence Helpers
- `loadData()`
  - Loads app data from local storage, returning parsed JSON or null.
- `saveData(d)`
  - Stores the app state into local storage.
- `mkDay(label,tags,status,exercises)`
  - Creates a new day object with default warmup and cooldown arrays.

## 4. Training Logic Helpers
- `calcNextLoad(ex, blockType)`
  - Computes the next training weight/load based on block type and RPE.
- `checkDeloadNeeded(client)`
  - Analyzes recent session logs to recommend a deload if RPE is high.
- `deriveProgress(client)`
  - Builds a progress summary from published week plans, including lift maxes, cardio notes, and volume by muscle group.
- `getExHistory(client)`
  - Aggregates exercise history across the client’s week plans.
- `getLastSessionDate(client)`
  - Finds the most recent logged session date.
- `estimateDuration(dayData)`
  - Estimates workout duration from exercise, warmup, and cooldown data.

## 5. Responsive Hook
- `useWidth()`
  - Tracks browser width to enable responsive rendering for mobile vs desktop layouts.

## 6. UI Primitives
These are reusable small components used throughout the app:
- `Avatar({name,idx,size})`
  - Renders a colored initials bubble for a client.
- `Tag({label})`
  - Displays a colored pill label for workout tags.
- `Pill({label,active,onClick})`
  - Renders a toggle-style button used for filters and tag selection.
- `Btn({children,onClick,primary,small,danger,ghost,style})`
  - A shared button component with style variants.
- `Modal({title,onClose,children,width})`
  - A modal overlay container used for popups.
- `Field({label,children})`
  - Labeled field wrapper used in forms.
- `Inp({value,onChange,type,placeholder,min,max,style})`
  - Styled input control.
- `Sel({value,onChange,options})`
  - Styled select/dropdown control.

## 7. Exercise Library Tab
- `ExerciseLibraryTab({library,onUpdateLibrary})`
  - Manages the exercise library view.
  - Supports searching, filtering by muscle and tags, adding custom exercises, editing existing exercises, and deleting exercises.
  - Uses `LibForm` internally to render the add/edit exercise form.

## 8. Home / Daily Schedule Tab
- `HomeTab({clients,onStartWorkout,onGoToPlan,onGoToClient})`
  - Displays today’s scheduled client sessions.
  - Lets the trainer navigate between dates, reorder client sessions, mark sessions complete, and preview workout details.
  - Shows summary metrics such as total clients, completed sessions, and session volume.

## 9. Client Tracker Tab
- `ClientTrackerTab({client,onUpdate})`
  - Shows client-specific tracking and customization options.
  - Displays deload recommendations, active periodization block, weekly availability, load projections, and widgets.
  - Supports widget customization, AI insight generation via an external Anthropic API call, and automatically generating a deload week.

## 10. Widget Components
Widgets power the client dashboard panels:
- `OverloadRows({liveLifts,blockType})`
  - Shows per-lift next load suggestions.
- `StrengthProgressRows({liveLifts})`
  - Shows progress toward strength goals.
- `CardioLogRows({cardio})`
  - Displays recent cardio log items.
- `VolumeTrackerRows({volume})`
  - Renders volume totals by muscle group.
- `MuscleGroupSplitRows({volume})`
  - Shows muscle group volume split percentages.
- `WidgetCard({id,client,liveLifts,derived,onUpdate,onRemove,customizing})`
  - Chooses which widget to render and provides a card wrapper.
- `KeyLiftsWidget({client,liveLifts,onUpdate})`
  - Editable key lift tracker for the client.
- `NotesWidget({client,onUpdate})`
  - Editable client notes panel.
- `InjuriesWidget({client,onUpdate})`
  - Injury management panel with add/edit/remove capabilities.

## 11. Onboarding Tab
- `OnboardingTab({clients,onAdd})`
  - Handles adding a new client.
  - Collects name, age, goal, level, availability, work ethic, and notes.
  - Creates a default client object with a blank weekly plan and default widgets.
  - Also lists the current clients in the sidebar.

## 12. Exercise Card / Add Modal
- `ExerciseSection({title,color,icon,exercises,onAdd,onUpdate,onRemove,onUpdateSetDetail,isDraft,exHistory,collapsed,library})`
  - Reusable section for warm-up, main workout, and cool-down exercise groups.
- `ExerciseCard({ex,idx,open,onToggle,onUpdate,onRemove,onUpdateSetDetail,exHistory})`
  - Renders an expandable card for a single exercise, with editable sets/reps/weight/rest, muscle group, and notes.
- `AddExerciseModal({onClose,onAdd,exHistory,library})`
  - Modal for adding an exercise from the library or creating a custom exercise.
  - Uses Anthropic AI to suggest a muscle group if a custom exercise name is entered.

## 13. Fitness Plans Tab
- `FitnessPlansTab({client,onUpdate,onStartWorkout,onGoToHome,library})`
  - Main planning view for a client’s weekly training plan.
  - Supports day and week views, publishing/unpublishing workouts, starting workouts, and calling AI for plan adjustments.
  - Manages week selection, active day selection, and adds exercises to warmup/main/cooldown.
- `WeekOverview({weekPlan,weekDates,weekOffset,setWeekOffset,onSelectDay,activeDay,isMobile})`
  - Displays a week grid overview of training days.

## 14. Workout Mode
- `WorkoutMode({client,dayData,dayName,date,onClose,onSaveLog,exHistory,library})`
  - Full-screen workout session interface.
  - Tracks live actual sets, reps, weights, completion status, elapsed time, and session notes.
  - Supports exercise swapping from the library, previous session reference, and saves a session log when finished.

## 15. Calendar and Periodization Views
- `CalendarView({client,onClose,onSelectDay})`
  - Displays a multi-week calendar grid of the client’s planned sessions.
  - Lets the trainer choose a day and jump back to the plan.
- `PeriodizationView({client,onUpdate,onClose})`
  - Displays and edits the client’s periodization blocks.
  - Provides a timeline-style block chart, current and past state labels, and block create/edit/delete functionality.

## 16. Root App Component
- `App()`
  - The app root and default export.
  - Loads saved clients and library from local storage or falls back to defaults.
  - Tracks current tab, selected client, workout session state, delete confirmation, and responsive sidebar behavior.
  - Persists state changes to local storage via `useEffect`.
  - Coordinates navigation between the Home, Tracker, Onboarding, Plans, and Library tabs.
  - Renders the selected tab component and the workout mode overlay when active.

---

This file is intended as a high-level guide to the structure of `trainer_app.tsx`, with enough detail to understand how each major section fits into the overall training app.
