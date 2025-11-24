import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Category } from "@/hooks/use-menu";

interface MenuTabsProps {
    categories: Category[];
    children: (categoryId: string) => React.ReactNode;
}

export function MenuTabs({ categories, children }: MenuTabsProps) {
    if (categories.length === 0) return <div>Cargando categorías...</div>;

    return (
        <Tabs defaultValue={categories[0].name} className="w-full">
            <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${categories.length}, minmax(0, 1fr))` }}>
                {categories.map(category => (
                    <TabsTrigger key={category.id} value={category.name}>{category.name}</TabsTrigger>
                ))}
            </TabsList>
            {categories.map(category => (
                <TabsContent key={category.id} value={category.name}>
                    <ScrollArea className="h-[60vh]">
                        <div className="space-y-6 pr-4 pt-4">
                            {children(category.id)}
                        </div>
                    </ScrollArea>
                </TabsContent>
            ))}
        </Tabs>
    );
}
