/*
This client component provides a blurred dashboard background.
*/

/*24124*/

"use client"

export function BlurredDashboardBackground() {
  return (
    <div className="absolute inset-0 blur-sm brightness-75">
      <div className="grid h-full grid-cols-12 gap-4 p-8">
        {/* This is a simplified dashboard mockup that will be blurred in the background */}
        <div className="bg-muted col-span-3 rounded-lg p-4 shadow-md">
          <div className="bg-primary/20 mb-4 h-8 w-24 rounded-md"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-primary/10 h-10 rounded-md"></div>
            ))}
          </div>
        </div>
        <div className="col-span-9 space-y-4">
          <div className="bg-muted h-32 rounded-lg p-4 shadow-md">
            <div className="grid h-full grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-primary/10 rounded-md"></div>
              ))}
            </div>
          </div>
          <div className="bg-muted h-64 rounded-lg p-4 shadow-md">
            <div className="bg-primary/20 mb-4 h-8 w-32 rounded-md"></div>
            <div className="grid h-4/5 grid-cols-2 gap-4">
              <div className="bg-primary/10 rounded-md"></div>
              <div className="bg-primary/10 rounded-md"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
