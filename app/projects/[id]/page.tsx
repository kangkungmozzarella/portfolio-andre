import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectPage } from "@/components/ProjectPage";
import { content } from "@/lib/content";

type Props = { params: Promise<{ id: string }> };

// Every project page is written out at build time; unknown ids are a 404.
export const dynamicParams = false;
export const generateStaticParams = () => content.projects.map((project) => ({ id: project.id }));

const find = async (params: Props["params"]) => {
  const { id } = await params;
  return content.projects.find((project) => project.id === id);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = await find(params);
  if (!project) return {};
  return {
    title: `${project.name}: ${content.profile.name}`,
    description: `${project.title} ${project.description}`.slice(0, 160),
  };
}

export default async function Page({ params }: Props) {
  const project = await find(params);
  if (!project) notFound();
  return <ProjectPage content={content} project={project} />;
}
