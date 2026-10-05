import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import EventEditClient from "@/components/admin/EventEditClient";

export default async function EventEditPage({
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

  return <EventEditClient eventId={id} />;
}