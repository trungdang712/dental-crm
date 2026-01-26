'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const countries = [
  { code: 'VN', name: 'Việt Nam', flag: '🇻🇳', phone: '+84' },
  { code: 'US', name: 'United States', flag: '🇺🇸', phone: '+1' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', phone: '+44' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', phone: '+61' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', phone: '+1' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', phone: '+65' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', phone: '+60' },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', phone: '+66' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', phone: '+81' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', phone: '+82' },
  { code: 'CN', name: 'China', flag: '🇨🇳', phone: '+86' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', phone: '+886' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', phone: '+852' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', phone: '+63' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', phone: '+62' },
  { code: 'IN', name: 'India', flag: '🇮🇳', phone: '+91' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', phone: '+49' },
  { code: 'FR', name: 'France', flag: '🇫🇷', phone: '+33' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', phone: '+39' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', phone: '+34' },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', phone: '+31' },
  { code: 'RU', name: 'Russia', flag: '🇷🇺', phone: '+7' },
  { code: 'AE', name: 'UAE', flag: '🇦🇪', phone: '+971' },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', phone: '+966' },
]

interface CountrySelectorProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

export function CountrySelector({
  value,
  onChange,
  placeholder = 'Chọn quốc gia',
  disabled = false,
}: CountrySelectorProps) {
  const [open, setOpen] = React.useState(false)

  const selectedCountry = countries.find((c) => c.code === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selectedCountry ? (
            <span className="flex items-center gap-2">
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Tìm quốc gia..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={`${country.name} ${country.code}`}
                  onSelect={() => {
                    onChange?.(country.code)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === country.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="mr-2">{country.flag}</span>
                  <span className="flex-1">{country.name}</span>
                  <span className="text-muted-foreground text-xs">
                    {country.phone}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export { countries }
