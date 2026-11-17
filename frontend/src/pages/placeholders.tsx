import { ComingSoon } from '../components/ComingSoon'

/*
 * Placeholder screens for routes that are planned but not implemented.
 * Replace each one with a real page in its own file when the feature is built.
 */

export function LoginPage() {
  return (
    <ComingSoon
      title="Log in"
      description="Sign in to see your plants and today's care tasks."
      plannedItems={['Email and password form with validation', 'Error messages from the API', 'Redirect to the Today view after login']}
      owner="Developer 1 (UI) and Developer 2 (auth API)"
    />
  )
}

export function RegisterPage() {
  return (
    <ComingSoon
      title="Create an account"
      description="Register to start building care schedules for your plants."
      plannedItems={['Email and password registration', 'Password rules shown while typing', 'Passwords hashed on the server, never stored in plain text']}
      owner="Developer 1 (UI) and Developer 2 (auth API)"
    />
  )
}

export function DashboardPage() {
  return (
    <ComingSoon
      title="Today"
      description="The daily entry point: everything your plants need today."
      plannedItems={['List of tasks due today, grouped by plant', 'Mark a task as done', '“Soil still wet” to move the next watering', 'Overdue tasks highlighted']}
      owner="Developer 1"
    />
  )
}

export function PlantsPage() {
  return (
    <ComingSoon
      title="My plants"
      description="All your plants and their next care dates in one place."
      plannedItems={['Plant cards with species and next watering date', 'Edit and delete a plant', 'Open a plant to see its care history']}
      owner="Developer 1 (UI) and Developer 2 (plants API)"
    />
  )
}

export function NewPlantPage() {
  return (
    <ComingSoon
      title="Add a plant"
      description="Describe a plant so Vazon can build its schedule."
      plannedItems={['Name and species', 'Light conditions and pot size', 'Distance from the radiator', 'Validation that matches the API DTOs']}
      owner="Developer 1 (UI) and Developer 2 (plants API)"
    />
  )
}

export function TasksPage() {
  return (
    <ComingSoon
      title="Care tasks"
      description="Upcoming watering, feeding and repotting across all plants."
      plannedItems={['Upcoming tasks by date', 'Filter by plant and task type', 'Dates shown in Europe/Kyiv time']}
      owner="Developer 1 (UI) and Developer 2 (schedule API)"
    />
  )
}
