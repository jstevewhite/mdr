# Mermaid Test

This is a test file to verify Mermaid diagram rendering in mdr.

## Flowchart Example

```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> A
    C --> E[End]
```

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant mdr
    participant Mermaid
    User->>mdr: Open markdown file
    mdr->>Mermaid: Render diagrams
    Mermaid-->>mdr: SVG output
    mdr-->>User: Display rendered content
```

## Class Diagram

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +String color
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat
```

## Regular Code Block (should not be rendered as Mermaid)

```javascript
console.log("This is just regular code");
```

## Pie Chart

```mermaid
pie title Languages Used in mdr
    "Go" : 60
    "JavaScript" : 30
    "CSS" : 10
```
