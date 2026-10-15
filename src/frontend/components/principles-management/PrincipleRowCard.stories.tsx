import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrincipleRowCard } from './PrincipleRowCard'

const principle = {
  id: 'P001',
  name: 'Beneficence',
  keywords: 'Systems should be designed to benefit individuals and society.',
  practice: 'Conduct impact assessments before deployment.',
}

const meta: Meta<typeof PrincipleRowCard> = {
  component: PrincipleRowCard,
  args: { principle },
}
export default meta

type Story = StoryObj<typeof PrincipleRowCard>

export const Default: Story = {}

export const Dragging: Story = {
  args: { isDragging: true },
}

export const WithInterpretation: Story = {
  args: {
    projectContext: 'We prioritise patient outcomes over efficiency gains.',
  },
}

export const Faded: Story = {
  args: { faded: true },
}

export const WithCoachMark: Story = {
  args: { showCoachMark: true },
}
