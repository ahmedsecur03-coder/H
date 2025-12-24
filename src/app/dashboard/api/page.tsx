'use client';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Code2, RefreshCw } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import type { User as UserType } from '@/lib/types';
import { doc } from "firebase/firestore";
import { ApiKeyCard } from "./_components/api-key-card";
import { CodeExample } from "./_components/code-example";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useTranslation } from "react-i18next";

function ApiPageSkeleton() {
    return (
        <div className="space-y-6 pb-8">
            <div>
                <Skeleton className="h-9 w-1/3" />
                <Skeleton className="h-5 w-2/3 mt-2" />
            </div>
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
    );
}

export default function ApiPage() {
    const { t } = useTranslation();
    const { user } = useUser();
    const firestore = useFirestore();

    const userDocRef = useMemoFirebase(() => (firestore && user ? doc(firestore, 'users', user.uid) : null), [firestore, user]);
    const { data: userData, isLoading } = useDoc<UserType>(userDocRef);

    if (isLoading || !userData) {
        return <ApiPageSkeleton />;
    }

    const apiKey = userData?.apiKey || 'YOUR_API_KEY';

    const addOrderExample = `{
  "key": "${apiKey}",
  "action": "add",
  "service": 1,
  "link": "https://www.instagram.com/p/C0_Zg3yI3bJ/",
  "quantity": 1000
}`;

    const orderStatusExample = `{
  "key": "${apiKey}",
  "action": "status",
  "order": 12345
}`;

    const servicesListExample = `{
  "key": "${apiKey}",
  "action": "services"
}`;

    const balanceExample = `{
  "key": "${apiKey}",
  "action": "balance"
}`;


    return (
        <div className="space-y-6 pb-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight font-headline flex items-center gap-2">
                    <Code2 className="h-8 w-8 text-primary" />
                    <span>{t('api.title')}</span>
                </h1>
                <p className="text-muted-foreground">
                    {t('api.description')}
                </p>
            </div>
            
            <ApiKeyCard apiKey={apiKey} />

            <Card>
                <CardHeader>
                    <CardTitle>{t('api.endpoints.title')}</CardTitle>
                     <CardDescription>
                        {t('api.endpoints.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CodeExample code="https://hajaty.com/api/v2" language="bash" />
                    <h3 className="font-semibold text-lg mb-4 mt-6">{t('api.actions.title')}</h3>

                    <div className="space-y-8">
                        <div>
                            <h4 className="font-medium text-xl border-b pb-2 mb-4">{t('api.actions.add.title')}</h4>
                            <p className="text-sm text-muted-foreground mb-4">{t('api.actions.add.description')}</p>
                            <CodeExample code={addOrderExample} language="json" />
                             <h5 className="font-medium mt-4 mb-2">{t('api.parameters')}</h5>
                             <Table>
                                <TableHeader><TableRow><TableHead>{t('api.parameter')}</TableHead><TableHead>{t('description')}</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell><code className="font-mono">key</code></TableCell><TableCell>{t('api.actions.add.params.key')}</TableCell></TableRow>
                                    <TableRow><TableCell><code className="font-mono">action</code></TableCell><TableCell>{t('api.actions.add.params.action')}</TableCell></TableRow>
                                    <TableRow><TableCell><code className="font-mono">service</code></TableCell><TableCell>{t('api.actions.add.params.service')}</TableCell></TableRow>
                                    <TableRow><TableCell><code className="font-mono">link</code></TableCell><TableCell>{t('api.actions.add.params.link')}</TableCell></TableRow>
                                    <TableRow><TableCell><code className="font-mono">quantity</code></TableCell><TableCell>{t('api.actions.add.params.quantity')}</TableCell></TableRow>
                                </TableBody>
                             </Table>
                        </div>
                         <div>
                            <h4 className="font-medium text-xl border-b pb-2 mb-4">{t('api.actions.status.title')}</h4>
                            <p className="text-sm text-muted-foreground mb-4">{t('api.actions.status.description')}</p>
                             <CodeExample code={orderStatusExample} language="json" />
                             <h5 className="font-medium mt-4 mb-2">{t('api.parameters')}</h5>
                             <Table>
                                <TableHeader><TableRow><TableHead>{t('api.parameter')}</TableHead><TableHead>{t('description')}</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    <TableRow><TableCell><code className="font-mono">key</code></TableCell><TableCell>{t('api.actions.status.params.key')}</TableCell></TableRow>
                                    <TableRow><TableCell><code className="font-mono">action</code></TableCell><TableCell>{t('api.actions.status.params.action')}</TableCell></TableRow>
                                    <TableRow><TableCell><code className="font-mono">order</code></TableCell><TableCell>{t('api.actions.status.params.order')}</TableCell></TableRow>
                                </TableBody>
                             </Table>
                        </div>
                         <div>
                            <h4 className="font-medium text-xl border-b pb-2 mb-4">{t('api.actions.services.title')}</h4>
                            <p className="text-sm text-muted-foreground mb-4">{t('api.actions.services.description')}</p>
                            <CodeExample code={servicesListExample} language="json" />
                        </div>
                         <div>
                            <h4 className="font-medium text-xl border-b pb-2 mb-4">{t('api.actions.balance.title')}</h4>
                            <p className="text-sm text-muted-foreground mb-4">{t('api.actions.balance.description')}</p>
                            <CodeExample code={balanceExample} language="json" />
                        </div>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>{t('api.responses.title')}</CardTitle>
                    <CardDescription>
                        {t('api.responses.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('api.responses.response')}</TableHead>
                                <TableHead>{t('description')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell><CodeExample code={`{"order": 12345}`} language="json" /></TableCell>
                                <TableCell>{t('api.responses.addSuccess')}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><CodeExample code={`{"charge": "0.50", "status": "قيد التنفيذ", ...}`} language="json" /></TableCell>
                                <TableCell>{t('api.responses.statusSuccess')}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell><CodeExample code={`[{"service": 1, "name": "...", "rate": "0.50"}, ... ]`} language="json" /></TableCell>
                                <TableCell>{t('api.responses.servicesSuccess')}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell><CodeExample code={`{"balance": "100.50", "currency": "USD"}`} language="json" /></TableCell>
                                <TableCell>{t('api.responses.balanceSuccess')}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell><CodeExample code={`{"error": "Incorrect request"}`} language="json" /></TableCell>
                                <TableCell>{t('api.responses.errorIncorrect')}</TableCell>
                            </TableRow>
                             <TableRow>
                                <TableCell><CodeExample code={`{"error": "Not enough funds"}`} language="json" /></TableCell>
                                <TableCell>{t('api.responses.errorFunds')}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell><CodeExample code={`{"error": "Invalid API key"}`} language="json" /></TableCell>
                                <TableCell>{t('api.responses.errorKey')}</TableCell>
                            </TableRow>
                        </TableBody>
                     </Table>
                </CardContent>
            </Card>

        </div>
    );
}
