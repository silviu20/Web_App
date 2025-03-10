/*
This client page provides the user account details and settings.
*/

"use client"

import { useState } from "react"
import { useUser } from "@clerk/nextjs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Loader2, Mail, User, KeyRound, Shield } from "lucide-react"

export default function AccountPage() {
  const { user, isLoaded } = useUser()
  const [isUpdating, setIsUpdating] = useState(false)

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="text-muted-foreground size-8 animate-spin" />
      </div>
    )
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    // Simulate an update
    setTimeout(() => {
      setIsUpdating(false)
    }, 1000)
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-6 text-3xl font-bold">Account Settings</h1>

      {/* User Profile Header */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <Avatar className="size-20">
              <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
              <AvatarFallback>{`${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`}</AvatarFallback>
            </Avatar>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-2xl font-bold">{user?.fullName}</h2>
              <p className="text-muted-foreground">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
              <div className="bg-primary/10 text-primary mt-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium">
                Free Plan
              </div>
            </div>
            <Button>Upgrade to Pro</Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different account settings */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      defaultValue={user?.firstName || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue={user?.lastName || ""} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={user?.primaryEmailAddress?.emailAddress || ""}
                    disabled
                  />
                  <p className="text-muted-foreground text-xs">
                    Your email address is used for signing in and cannot be
                    changed here.
                  </p>
                </div>

                <Button type="submit" disabled={isUpdating}>
                  {isUpdating && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Password Tab */}
        <TabsContent value="password">
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>Update your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <Button>Update Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
              <CardDescription>
                Manage your subscription and payment methods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="rounded-md border p-4">
                  <div className="mb-4 flex flex-col justify-between sm:flex-row">
                    <div>
                      <h3 className="font-medium">Current Plan</h3>
                      <p className="text-muted-foreground">Free Plan</p>
                    </div>
                    <Button>Upgrade to Pro</Button>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Plan Features:</h4>
                    <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                      <li>Basic access to experiments</li>
                      <li>Limited optimization options</li>
                      <li>Standard support</li>
                      <li>Up to 5 projects</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="mb-2 font-medium">Payment Methods</h3>
                  <p className="text-muted-foreground mb-4">
                    No payment methods added yet.
                  </p>
                  <Button variant="outline">
                    <CreditCard className="mr-2 size-4" />
                    Add Payment Method
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your account security preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Mail className="text-muted-foreground size-5" />
                    <div>
                      <h3 className="font-medium">Email Verification</h3>
                      <p className="text-muted-foreground text-sm">
                        Your email has been verified
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    Verified
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <KeyRound className="text-muted-foreground size-5" />
                    <div>
                      <h3 className="font-medium">Two-Factor Authentication</h3>
                      <p className="text-muted-foreground text-sm">
                        Add an extra layer of security
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Enable
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="text-muted-foreground size-5" />
                    <div>
                      <h3 className="font-medium">Session Management</h3>
                      <p className="text-muted-foreground text-sm">
                        Manage your active sessions
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    View Sessions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
