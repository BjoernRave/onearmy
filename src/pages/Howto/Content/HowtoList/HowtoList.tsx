import * as React from 'react'
import { Card, Image, Box, Flex } from 'rebass'
import { Flex as FlexGrid } from '@rebass/grid'
// TODO add loader (and remove this material-ui dep)
import LinearProgress from '@material-ui/core/LinearProgress'
import Text from 'src/components/Text'
import { Link } from 'src/components/Links'
import styled from 'styled-components'

import PpLogo from 'src/assets/images/pp-icon-small.png'

import { Button } from 'src/components/Button'
import { IHowto } from 'src/models/howto.models'
import { TagDisplay } from 'src/components/Tags/TagDisplay/TagDisplay'
import { AuthWrapper } from 'src/components/Auth/AuthWrapper'

interface IProps {
  allHowtos: IHowto[]
}

// TODO create Card component
const CardImage = styled(Image)`
  height: 230px;
  object-fit: cover;
  width: 100%;
`
const CardInfosContainer = styled(Box)`
  height: 120px;
`

const CardTitle = styled(Text)`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`

export class HowtoList extends React.Component<IProps, any> {
  constructor(props: any) {
    super(props)
  }

  public render() {
    const { allHowtos } = this.props
    return (
      <>
        <Flex justifyContent={'right'}>
          <AuthWrapper>
            <Link to={'/how-to/create'}>
              <Button variant="outline" icon={'add'}>
                create
              </Button>
            </Link>
          </AuthWrapper>
        </Flex>
        <React.Fragment>
          <div>
            {allHowtos.length === 0 ? (
              <LinearProgress />
            ) : (
              <FlexGrid flexWrap={'wrap'} justifyContent={'space-between'}>
                {allHowtos.map((howto: IHowto) => (
                  <Link
                    to={`/how-to/${encodeURIComponent(howto.slug)}`}
                    key={howto._id}
                  >
                    <Box my={4}>
                      <Card borderRadius={1} width={[380]} bg={'white'}>
                        <CardImage src={howto.cover_image.downloadUrl} />
                        <Box width={'45px'} bg="white" mt={'-24px'} ml={'29px'}>
                          <Image src={PpLogo} />
                        </Box>
                        <CardInfosContainer px={4} pb={3}>
                          <CardTitle fontSize={4} bold>
                            {howto.title}
                          </CardTitle>

                          <Text fontSize={1} mt={2} mb={3} color={'grey4'}>
                            by{' '}
                            <Text inline color={'black'}>
                              {howto._createdBy}
                            </Text>
                          </Text>
                          {howto.tags &&
                            Object.keys(howto.tags).map(tag => {
                              return <TagDisplay key={tag} tagKey={tag} />
                            })}
                        </CardInfosContainer>
                      </Card>
                    </Box>
                  </Link>
                ))}
              </FlexGrid>
            )}
          </div>
        </React.Fragment>
      </>
    )
  }
}
