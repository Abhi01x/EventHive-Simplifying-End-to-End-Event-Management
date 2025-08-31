import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin } from "lucide-react"

export type EventCardProps = {
  id: string
  title: string
  image?: string
  category: string
  status?: "registration_open" | "not_open"
  shortDescription?: string
  dateLabel?: string
  location: { venue: string; city: string }
}

export function EventCard(props: EventCardProps) {
  const { id, title, image, category, status, shortDescription, dateLabel, location } = props
  return (
    <Card className="overflow-hidden">
      <img
        src={image || "/placeholder.svg?height=160&width=320&query=event"}
        alt={`${title} cover`}
        className="w-full h-40 object-cover"
      />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          {status === "not_open" ? (
            <Badge className="bg-gray-100 text-gray-700">Registration not yet open</Badge>
          ) : null}
        </div>
        <CardTitle className="text-base mt-1">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {shortDescription ? <p className="line-clamp-3 mb-3">{shortDescription}</p> : null}
        <div className="flex items-center gap-1 text-xs">
          <MapPin className="w-3.5 h-3.5" aria-hidden />
          <span>
            {location.venue}, {location.city}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs">{dateLabel}</span>
          <Button asChild size="sm">
            <Link href={`/events/${id}`} aria-label={`Register for ${title}`}>
              Register now
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
