import React from 'react';
import { Button } from '@/components/ui/button';
import { Delete, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumericKeypadProps {
    value: string;
    onChange: (value: string) => void;
    onConfirm?: () => void;
    confirmLabel?: string;
    confirmIcon?: React.ReactNode;
    className?: string;
    maxLength?: number;
}

export function NumericKeypad({
    value,
    onChange,
    onConfirm,
    confirmLabel = "Aceptar",
    confirmIcon,
    className,
    maxLength = 10
}: NumericKeypadProps) {

    const handleNumberClick = (num: string) => {
        if (value.length >= maxLength) return;

        // Prevent multiple decimals
        if (num === '.' && value.includes('.')) return;

        // Prevent multiple leading zeros unless it's a decimal
        if (value === '0' && num !== '.') {
            onChange(num);
        } else {
            onChange(value + num);
        }
    };

    const handleBackspace = () => {
        if (value.length === 0) return;
        onChange(value.slice(0, -1));
    };

    const handleClear = () => {
        onChange('');
    };

    return (
        <div className={cn("grid grid-cols-3 gap-2 w-full max-w-[300px] mx-auto", className)}>
            {[7, 8, 9, 4, 5, 6, 1, 2, 3].map((num) => (
                <Button
                    key={num}
                    type="button"
                    variant="outline"
                    className="h-14 text-2xl font-semibold"
                    onClick={() => handleNumberClick(num.toString())}
                >
                    {num}
                </Button>
            ))}
            <Button
                type="button"
                variant="outline"
                className="h-14 text-2xl font-semibold"
                onClick={() => handleNumberClick('.')}
            >
                .
            </Button>
            <Button
                type="button"
                variant="outline"
                className="h-14 text-2xl font-semibold"
                onClick={() => handleNumberClick('0')}
            >
                0
            </Button>
            <Button
                type="button"
                variant="outline"
                className="h-14"
                onClick={handleBackspace}
            >
                <Delete className="h-6 w-6" />
            </Button>
            {/* Optional row for clear / confirm if needed, or we can make the grid 4x3? 
           For now 4x3 grid seems standard:
           7 8 9
           4 5 6
           1 2 3
           . 0 <
       */}
            <Button
                type="button"
                variant="ghost"
                className="col-span-1 text-sm text-muted-foreground"
                onClick={handleClear}
            >
                Borrar
            </Button>
            <div className="col-span-2">
                {onConfirm && (
                    <Button
                        type="button"
                        className="w-full h-full bg-green-600 hover:bg-green-700 text-lg"
                        onClick={onConfirm}
                    >
                        {confirmIcon || <Check className="mr-2 h-5 w-5" />} {confirmLabel}
                    </Button>
                )}
            </div>
        </div>
    );
}
