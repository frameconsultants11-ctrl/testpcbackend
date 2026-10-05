import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import EventDetailsClient from "@/components/admin/EventDetailsClient";

export default async function EventDetailsPage({
  params,
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  return <EventDetailsClient eventId={id} />;
}