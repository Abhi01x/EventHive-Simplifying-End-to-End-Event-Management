"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin } from "lucide-react"

type Props = {
  event: {
    id: string
    title: string
    category: string
    type: string
    date: string
    imageUrl: string
    description: string
    location: string
    status?: string
  }
}

export function EventCard({ event }: Props) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="relative">
          {/* image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.imageUrl || "/placeholder.svg"}
            alt={`${event.title} banner`}
            className="h-40 w-full object-cover"
          />
          {/* category pill */}
          <Badge variant="secondary" className="absolute left-3 top-3 bg-white/90 text-foreground">
            {event.category}
          </Badge>
          {/* date label */}
          <span className="absolute right-3 top-3 rounded-md bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
            {event.date}
          </span>
        </div>

        <div className="space-y-2 p-4">
          <h3 className="line-clamp-1 text-lg font-semibold">{event.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{event.description}</p>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" aria-hidden />
              <span className="line-clamp-1">{event.location}</span>
            </div>
            {event.status && (
              <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">{event.status}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
