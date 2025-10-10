import { Avatar as AvatarBase, AvatarImage } from '@aamini/ui/components/avatar'

export default function Avatar({
	name,
	avatar,
}: {
	name: string
	avatar: string
}) {
	return (
		<AvatarBase className="h-10 w-10">
			<AvatarImage src={avatar} alt={`${name} avatar`} />
		</AvatarBase>
	)
}
