import { Button } from "@/components/ui/button";

const sectionStyles = "space-y-4";
const titleStyles = "text-text-primary text-lg font-medium";
const descriptionStyles = "text-text-secondary text-sm";

export default function ComponentsPage() {
  return (
    <div className="min-h-screen bg-bg-page p-8 space-y-12">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">UI Components</h1>
        <p className="text-text-secondary">
          Preview of all available UI components and their variants.
        </p>
      </header>

      <section className={sectionStyles}>
        <h2 className={titleStyles}>Button</h2>
        <p className={descriptionStyles}>
          Displays a button or a component that looks like a button.
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-text-tertiary text-sm">Variants</h3>
            <div className="flex flex-wrap gap-4">
              <Button>default</Button>
              <Button variant="destructive">destructive</Button>
              <Button variant="outline">outline</Button>
              <Button variant="secondary">secondary</Button>
              <Button variant="ghost">ghost</Button>
              <Button variant="link">link</Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-text-tertiary text-sm">Sizes</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Button size="sm">small</Button>
              <Button size="default">default</Button>
              <Button size="lg">large</Button>
              <Button size="icon">Icon</Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-text-tertiary text-sm">Rounded</h3>
            <div className="flex flex-wrap gap-4">
              <Button rounded="none">none</Button>
              <Button rounded="sm">small</Button>
              <Button rounded="default">default</Button>
              <Button rounded="lg">large</Button>
              <Button rounded="full">full</Button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-text-tertiary text-sm">States</h3>
            <div className="flex flex-wrap gap-4">
              <Button>default</Button>
              <Button disabled>disabled</Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
