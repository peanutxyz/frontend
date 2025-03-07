// src/components/supplier/settings/AccountSettings.tsx

"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";

export default function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState(16);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  
  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value[0]);
    document.documentElement.style.fontSize = `${value[0]}px`;
    toast.success(`Font size updated to ${value[0]}px`);
  };
  
  const toggleAnimations = () => {
    setAnimationsEnabled(!animationsEnabled);
    document.documentElement.classList.toggle('reduce-motion');
    toast.success(`Animations ${!animationsEnabled ? 'enabled' : 'disabled'}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Appearance</h3>
        <p className="text-sm text-muted-foreground">
          Customize how the dashboard looks and feels.
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="text-base font-medium mb-4">Theme</h4>
          <RadioGroup 
            defaultValue={theme} 
            onValueChange={(value) => {
              setTheme(value);
              toast.success(`Theme changed to ${value}`);
            }}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem 
                value="light" 
                id="light" 
                className="peer sr-only" 
              />
              <Label
                htmlFor="light"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-white p-4 hover:bg-gray-100 hover:text-gray-900 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mb-3">
                  <circle cx="12" cy="12" r="4"></circle>
                  <path d="M12 2v2"></path>
                  <path d="M12 20v2"></path>
                  <path d="m4.93 4.93 1.41 1.41"></path>
                  <path d="m17.66 17.66 1.41 1.41"></path>
                  <path d="M2 12h2"></path>
                  <path d="M20 12h2"></path>
                  <path d="m6.34 17.66-1.41 1.41"></path>
                  <path d="m19.07 4.93-1.41 1.41"></path>
                </svg>
                Light
              </Label>
            </div>
            
            <div>
              <RadioGroupItem 
                value="dark" 
                id="dark" 
                className="peer sr-only" 
              />
              <Label
                htmlFor="dark"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-gray-950 text-white p-4 hover:bg-gray-900 hover:text-gray-50 peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mb-3">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                </svg>
                Dark
              </Label>
            </div>
            
            <div>
              <RadioGroupItem 
                value="system" 
                id="system" 
                className="peer sr-only" 
              />
              <Label
                htmlFor="system"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 mb-3">
                  <rect width="20" height="14" x="2" y="3" rx="2"></rect>
                  <line x1="8" x2="16" y1="21" y2="21"></line>
                  <line x1="12" x2="12" y1="17" y2="21"></line>
                </svg>
                System
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="font-size">Font Size ({fontSize}px)</Label>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setFontSize(16);
                document.documentElement.style.fontSize = '16px';
                toast.success('Font size reset to default');
              }}
            >
              Reset
            </Button>
          </div>
          <Slider
            id="font-size"
            defaultValue={[16]}
            min={12}
            max={20}
            step={1}
            value={[fontSize]}
            onValueChange={handleFontSizeChange}
            className="w-full"
          />
        </div>
        
        <div className="pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={toggleAnimations}
          >
            {animationsEnabled ? 'Disable' : 'Enable'} Animations
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            Toggles UI animations and transitions. Disabling may improve performance.
          </p>
        </div>
      </div>
    </div>
  );
}