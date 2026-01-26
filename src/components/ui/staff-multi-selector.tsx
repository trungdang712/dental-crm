'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

interface Staff {
  id: string
  name?: string | null
  email: string
  role?: string
}

interface StaffMultiSelectorProps {
  staff: Staff[]
  value?: string[]
  onChange?: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  maxSelected?: number
}

export function StaffMultiSelector({
  staff,
  value = [],
  onChange,
  placeholder = 'Chọn nhân viên',
  disabled = false,
  maxSelected,
}: StaffMultiSelectorProps) {
  const [open, setOpen] = React.useState(false)

  const selectedStaff = staff.filter((s) => value.includes(s.id))

  const toggleStaff = (staffId: string) => {
    if (value.includes(staffId)) {
      onChange?.(value.filter((id) => id !== staffId))
    } else {
      if (maxSelected && value.length >= maxSelected) {
        return
      }
      onChange?.([...value, staffId])
    }
  }

  const removeStaff = (staffId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange?.(value.filter((id) => id !== staffId))
  }

  const getInitials = (name: string | null | undefined, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    }
    return email.charAt(0).toUpperCase()
  }

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-100 text-red-700 text-[10px]">Admin</Badge>
      case 'manager':
        return <Badge className="bg-blue-100 text-blue-700 text-[10px]">Manager</Badge>
      default:
        return <Badge className="bg-green-100 text-green-700 text-[10px]">Sales</Badge>
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-full justify-between font-normal min-h-[40px] h-auto',
            selectedStaff.length > 0 && 'py-1.5'
          )}
          disabled={disabled}
        >
          {selectedStaff.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selectedStaff.map((s) => (
                <Badge
                  key={s.id}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  <span className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold">
                    {getInitials(s.name, s.email)}
                  </span>
                  <span className="max-w-[100px] truncate text-xs">
                    {s.name || s.email}
                  </span>
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-destructive"
                    onClick={(e) => removeStaff(s.id, e)}
                  />
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Tìm nhân viên..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy.</CommandEmpty>
            <CommandGroup>
              {staff.map((s) => {
                const isSelected = value.includes(s.id)
                const isDisabled =
                  !isSelected && maxSelected && value.length >= maxSelected

                return (
                  <CommandItem
                    key={s.id}
                    value={`${s.name || ''} ${s.email}`}
                    onSelect={() => !isDisabled && toggleStaff(s.id)}
                    className={cn(isDisabled && 'opacity-50')}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        isSelected ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
                        {getInitials(s.name, s.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {s.name || s.email}
                        </p>
                        {s.name && (
                          <p className="text-xs text-muted-foreground truncate">
                            {s.email}
                          </p>
                        )}
                      </div>
                      {getRoleBadge(s.role)}
                    </div>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        {maxSelected && (
          <div className="p-2 border-t text-xs text-muted-foreground text-center">
            {value.length}/{maxSelected} đã chọn
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
