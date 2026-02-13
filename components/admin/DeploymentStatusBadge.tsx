import { Badge } from '@/components/ui/badge';

interface DeploymentStatusBadgeProps {
    status: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
}

export default function DeploymentStatusBadge({ status }: DeploymentStatusBadgeProps) {
    const variants = {
        BUILDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        READY: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        ERROR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        CANCELED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };

    return (
        <Badge className={`${variants[status]} font-bold uppercase text-xs px-2 py-0.5`}>
            {status}
        </Badge>
    );
}
