"use client";

import dynamic from "next/dynamic";
import type { SylvaLivingWorldSceneProps as SceneProps } from "../../shaders/sylva-living-world/SylvaLivingWorldScene";

export type {
  SylvaLivingWorldSceneProps,
  SylvaLivingWorldVariant,
} from "../../shaders/sylva-living-world/SylvaLivingWorldScene";

export const SylvaLivingWorldScene = dynamic<SceneProps>(
  () => import("../../shaders/sylva-living-world/SylvaLivingWorldScene").then((module) => module.SylvaLivingWorldScene),
  { ssr: false },
);
