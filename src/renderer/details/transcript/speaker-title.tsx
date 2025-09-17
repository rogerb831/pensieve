import { FC } from "react";
import { Avatar, Flex, Text } from "@radix-ui/themes";
import { HiOutlineUserCircle, HiOutlineUserGroup } from "react-icons/hi2";

export const SpeakerTitle: FC<{
  timeText: string;
  speaker: string;
}> = ({ timeText, speaker }) => {
  // Auto-detect transcription engine based on speaker format
  let speakerText: string;
  let avatarIcon: React.ReactNode;
  
  if (speaker === "0") {
    // Whisper stereo format: left channel = "They"
    speakerText = "They";
    avatarIcon = <HiOutlineUserGroup />;
  } else if (speaker === "1") {
    // Whisper stereo format: right channel = "Me"
    speakerText = "Me";
    avatarIcon = <HiOutlineUserCircle />;
  } else if (speaker === "?") {
    // No speaker detected
    speakerText = "?";
    avatarIcon = "?";
  } else if (speaker.startsWith("Speaker ")) {
    // Maleo format: "Speaker 1", "Speaker 2", etc.
    speakerText = speaker;
    avatarIcon = <HiOutlineUserCircle />;
  } else if (speaker.startsWith("Speakers ")) {
    // Maleo format: "Speakers 1 & 2" (overlapping speech)
    speakerText = speaker;
    avatarIcon = <HiOutlineUserGroup />;
  } else {
    // Fallback for any other format
    speakerText = speaker;
    avatarIcon = speaker[0] || "?";
  }
  
  return (
    <Flex align="center">
      <Avatar fallback={avatarIcon} size="2" />
      <Text weight="bold" ml=".5rem" style={{ flexGrow: 1 }}>
        {speakerText}
      </Text>
      <Text color="gray">{timeText}</Text>
    </Flex>
  );
};
