import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CodeBlock } from "@/components/ui/code-block";
import { DiffLine } from "@/components/ui/diff-line";
import { Toggle } from "@/components/ui/toggle";

const sectionStyles = "space-y-4";
const titleStyles = "text-text-primary text-lg font-medium";
const descriptionStyles = "text-text-secondary text-sm";

const sampleCode = `function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
}`;

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

      <section className={sectionStyles}>
        <h2 className={titleStyles}>Toggle</h2>
        <p className={descriptionStyles}>
          A two-state toggle switch component.
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-text-tertiary text-sm">States</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Toggle>Off</Toggle>
              <Toggle defaultChecked>On</Toggle>
              <Toggle disabled>Disabled</Toggle>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-text-tertiary text-sm">Sizes</h3>
            <div className="flex flex-wrap items-center gap-4">
              <Toggle size="sm">Small</Toggle>
              <Toggle>Default</Toggle>
              <Toggle size="lg">Large</Toggle>
            </div>
          </div>
        </div>
      </section>

      <section className={sectionStyles}>
        <h2 className={titleStyles}>Badge</h2>
        <p className={descriptionStyles}>
          Small status labels for indicating state or category.
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-text-tertiary text-sm">Variants</h3>
            <div className="flex flex-wrap gap-4">
              <Badge variant="critical">critical</Badge>
              <Badge variant="warning">warning</Badge>
              <Badge variant="good">good</Badge>
              <Badge variant="verdict">verdict</Badge>
            </div>
          </div>
        </div>
      </section>

      <section className={sectionStyles}>
        <h2 className={titleStyles}>Card</h2>
        <p className={descriptionStyles}>
          A container for grouping related content.
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-text-tertiary text-sm">Variants</h3>
            <div className="flex flex-wrap gap-4">
              <Card className="w-80">
                <p className="text-text-primary">Default card</p>
              </Card>
              <Card variant="elevated" className="w-80">
                <p className="text-text-primary">Elevated card</p>
              </Card>
              <Card variant="ghost" className="w-80">
                <p className="text-text-primary">Ghost card</p>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className={sectionStyles}>
        <h2 className={titleStyles}>Code Block</h2>
        <p className={descriptionStyles}>
          Server component for syntax-highlighted code using shiki.
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-text-tertiary text-sm">Default</h3>
            <CodeBlock code={sampleCode} language="javascript" />
          </div>
        </div>
      </section>

      <section className={sectionStyles}>
        <h2 className={titleStyles}>Diff Line</h2>
        <p className={descriptionStyles}>
          Display lines of code diffs with context-aware styling.
        </p>

        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-text-tertiary text-sm">Variants</h3>
            <div className="space-y-1">
              <DiffLine variant="removed">{'- const var = "old";'}</DiffLine>
              <DiffLine variant="added">{'+ const let = "new";'}</DiffLine>
              <DiffLine variant="context">
                {'  const const = "unchanged";'}
              </DiffLine>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
