import {ResetIcon, WarningOutlineIcon} from '@sanity/icons'
import {Box, Card, Flex, Stack, Text} from '@sanity/ui'

import {useTranslation} from '../../../core/i18n'
import {Button} from '../../../ui-components/button'

type Props = {
  onClearValue?: () => void
}

export function InvalidVideoWarning({onClearValue}: Props) {
  const {t} = useTranslation()
  return (
    <Card tone="caution" padding={4} border radius={2}>
      <Flex gap={4} marginBottom={4}>
        <Box>
          <Text size={1}>
            <WarningOutlineIcon />
          </Text>
        </Box>
        <Stack space={3}>
          <Text size={1} weight="medium">
            {t('inputs.file.invalid-file-warning.title')}
          </Text>
          <Text size={1}>{t('inputs.file.invalid-file-warning.description')}</Text>
        </Stack>
      </Flex>
      <Button
        icon={ResetIcon}
        mode="ghost"
        onClick={onClearValue}
        text={t('inputs.file.invalid-file-warning.reset-button.text')}
        width="fill"
      />
    </Card>
  )
}
