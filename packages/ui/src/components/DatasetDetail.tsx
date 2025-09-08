import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { DatasetFile, DatasetItem } from '../types'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Collapsible, CollapsibleContent } from './ui/collapsible'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import { ValueRenderer } from './ValueRenderer'


interface DatasetDetailProps {
  dataset: DatasetFile
  loading?: boolean
  error?: string | null
}

export default function DatasetDetail({ dataset, loading = false, error }: DatasetDetailProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading dataset...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-destructive text-center py-8">
        Error: {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Dataset Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{dataset.items.length}</div>
              <div className="text-sm text-muted-foreground">Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {dataset.items.filter(item => item.input !== undefined).length}
              </div>
              <div className="text-sm text-muted-foreground">With Input</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {dataset.items.filter(item => item.expected !== undefined).length}
              </div>
              <div className="text-sm text-muted-foreground">With Expected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                <Badge variant="outline">{dataset.storage}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">Storage</div>
            </div>
          </div>
          {dataset.createdAt && (
            <div className="mt-4 text-sm text-muted-foreground">
              Created: {new Date(dataset.createdAt).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dataset Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>
              Dataset contains {dataset.items.length} items. Click on rows to view details.
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Input Preview</TableHead>
                <TableHead>Expected Preview</TableHead>
                <TableHead>Metadata Keys</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataset.items.map((item, index) => (
                <DatasetItemRow key={item.id || index} item={item} index={index} />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function DatasetItemRow({ item, index }: { item: DatasetItem; index: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const hasDetails = item.input !== undefined || item.expected !== undefined

  return (
    <>
      <TableRow
        className={hasDetails ? "cursor-pointer hover:bg-muted/50" : ""}
        onClick={() => hasDetails && setIsOpen(!isOpen)}
      >
        <TableCell className="font-medium">
          <div className="flex items-center gap-2">
            {hasDetails && (
              <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
            {item.name || `Item ${index + 1}`}
          </div>
        </TableCell>
        <TableCell>
          {item.input !== undefined ? (
            <Badge variant="secondary" className="text-xs">
              {typeof item.input === 'string'
                ? item.input.length > 50
                  ? `${item.input.substring(0, 50)}...`
                  : item.input
                : typeof item.input
              }
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">No input</span>
          )}
        </TableCell>
        <TableCell>
          {item.expected !== undefined ? (
            <Badge variant="secondary" className="text-xs">
              {typeof item.expected === 'string'
                ? item.expected.length > 50
                  ? `${item.expected.substring(0, 50)}...`
                  : item.expected
                : typeof item.expected
              }
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">No expected</span>
          )}
        </TableCell>
        <TableCell>
          {item.metadata && Object.keys(item.metadata).length > 0 ? (
            <div className="flex gap-1 flex-wrap">
              {Object.keys(item.metadata).slice(0, 3).map((key) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key}
                </Badge>
              ))}
              {Object.keys(item.metadata).length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{Object.keys(item.metadata).length - 3} more
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-xs">No metadata</span>
          )}
        </TableCell>
      </TableRow>
      {hasDetails && isOpen && (
        <TableRow>
          <TableCell colSpan={4} className="p-0">
            <Collapsible open={isOpen}>
              <CollapsibleContent>
                <div className="bg-muted/30 p-4 space-y-4">
                  {item.input !== undefined && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Input:</h4>
                      <ValueRenderer value={item.input} label="Input" />
                    </div>
                  )}
                  {item.expected !== undefined && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Expected Output:</h4>
                      <ValueRenderer value={item.expected} label="Expected output" />
                    </div>
                  )}
                  {item.metadata && Object.keys(item.metadata).length > 0 && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Metadata:</h4>
                      <ValueRenderer value={item.metadata} label="Metadata" />
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </TableCell>
        </TableRow>
      )}
    </>
  )
}
