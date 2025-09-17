import { FC, useCallback, useEffect, useState } from "react";
import { Box, Flex } from "@radix-ui/themes";
import * as Tabs from "@radix-ui/react-tabs";
import { useQuery } from "@tanstack/react-query";
import { FormProvider, useForm } from "react-hook-form";
import { useDebouncedCallback } from "@react-hookz/web";
import {
  HiOutlineCheckCircle,
  HiOutlineWrenchScrewdriver,
} from "react-icons/hi2";
import { useSearch } from "@tanstack/react-router";
import { PageContainer } from "../common/page-container";
import { QueryKeys } from "../../query-keys";
import { mainApi } from "../api";
import { Settings } from "../../types";
import { GeneralSettings } from "./general-settings";
import { TranscriptionSettings } from "./transcription-settings";
import { SettingsTabs } from "./settings-tabs";
import { FfmpegSettings } from "./ffmpeg-settings";
import { SummarySettings } from "./summary-settings";
import { HooksSettings } from "./hooks-settings";
import { AboutSettings } from "./about-settings";

export const SettingsScreen: FC = () => {
  const { settingsTab } = useSearch({
    from: "/settings" as const,
  });
  const { data: values, isLoading } = useQuery({
    queryKey: [QueryKeys.Settings],
    queryFn: mainApi.getSettings,
  });
  const form = useForm<Settings>({ 
    values: values || undefined, 
    mode: "onChange",
    defaultValues: values
  });
  const [hasSaved, setHasSaved] = useState(false);

  const flushSubmit = useCallback(
    () => mainApi.saveSettings(form.getValues()),
    [form],
  );

  const handleSubmit = useDebouncedCallback(
    () => {
      mainApi.saveSettings(form.getValues());
      setHasSaved((old) => {
        if (!old) {
          setTimeout(() => setHasSaved(false), 1500);
          return true;
        }
        return old;
      });
    },
    [],
    1000,
    10000,
  );

  useEffect(() => {
    window.addEventListener("beforeunload", flushSubmit);
    return () => window.removeEventListener("beforeunload", flushSubmit);
  }, [flushSubmit]);

  if (isLoading || !values) {
    return (
      <PageContainer
        title="Settings"
        icon={<HiOutlineWrenchScrewdriver />}
      >
        <Box>Loading settings...</Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Settings"
      icon={
        hasSaved ? <HiOutlineCheckCircle /> : <HiOutlineWrenchScrewdriver />
      }
    >
      <Tabs.Root
        orientation="vertical"
        defaultValue={settingsTab ?? "general"}
        style={{ height: "100%" }}
      >
        <Flex height="100%">
          <Tabs.List>
            <SettingsTabs />
          </Tabs.List>
          <Box height="100%" overflowY="auto" flexGrow="1" pr="1rem" pt="1rem">
            <form onChange={handleSubmit}>
              <FormProvider {...form}>
                <GeneralSettings />
                <FfmpegSettings />
                <TranscriptionSettings />
                <SummarySettings />
                <HooksSettings />
                <AboutSettings />
              </FormProvider>
            </form>
          </Box>
        </Flex>
      </Tabs.Root>
    </PageContainer>
  );
};
