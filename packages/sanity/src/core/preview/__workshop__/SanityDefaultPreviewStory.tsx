import {Box, Card, Container} from '@sanity/ui-v3'

import {SanityDefaultPreview} from '../components/SanityDefaultPreview'

export default function SanityDefaultPreviewStory() {
  return (
    <Box padding={4}>
      <Container width={1}>
        <Card border>
          <SanityDefaultPreview title="Hello" />
        </Card>
      </Container>
    </Box>
  )
}
