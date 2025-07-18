import {Flex, Skeleton, Stack, TextSkeleton} from '@sanity/ui'

export function VideoSkeleton() {
  return (
    <Flex align="center" justify="flex-start" padding={2}>
      <Skeleton padding={3} radius={1} animated />
      <Stack flex={1} space={2} marginLeft={3}>
        <TextSkeleton style={{width: '100%'}} radius={1} animated />
        <TextSkeleton style={{width: '100%'}} radius={1} animated />
      </Stack>
    </Flex>
  )
}
