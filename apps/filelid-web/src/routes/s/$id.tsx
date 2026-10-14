import { createFileRoute, notFound } from '@tanstack/react-router'
import { SharePage } from '../../pages/share-page'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const Route = createFileRoute('/s/$id')({
  beforeLoad: ({ params }) => {
    if (!UUID_REGEX.test(params.id)) {
      throw notFound()
    }
  },
  component: ShareRouteComponent,
})

function ShareRouteComponent() {
  const { id } = Route.useParams()
  return <SharePage id={id} />
}
